/// <reference path="./dataplat.elements.d.ts" />

class DPDataSource {
    data: IDPDataSource;
    idParam: string;
    parentIdParam: string;
    children: string;
    isTree: boolean;
    onLoad: Function | undefined;
    onAdd: Function | undefined;
    onRemove: Function | undefined;
    onEdit: Function | undefined;
    onSort: Function | undefined;
    onChange: Function | undefined;
    onAddEmpty: Function | undefined;
    private _nullGuid: string;

    constructor(property: IDPDataSource) {
        this.data = property;
        this.idParam = 'id';
        this.parentIdParam = 'parentId';
        this.children = 'children';
        this.isTree = false;
        this._nullGuid = '00000000-0000-0000-0000-000000000000';
        if (this.data) {
            this.Schema();
            if (this.data.list) {
                this.Load(this.data.list);
            } else if (this.data.transport) {
                if (this.data.transport.read) {
                    this.data.transport.read((e: any) => {
                        this.Load(e);
                    });
                }
            }
        }
    }

    /** Присваиваем значения из схемы в переменные dataSource */
    Schema() {
        if (this.data.schema) {
            if (this.data.schema.model) {
                if (this.data.schema.model.id) {
                    this.idParam = this.data.schema.model.id;
                }
                if (this.data.schema.model.parentId) {
                    this.parentIdParam = this.data.schema.model.parentId;
                }
                if (this.data.schema.model.children) {
                    this.children = this.data.schema.model.children;
                }
            }
        }
    }

    /**
     * Загружаем список
     * @param list - Список
     */
    private Load(list: any) {
        this.data.list = [];
        if (list.length) {
            this._handleList(list);
        }

        if (typeof this.onLoad === 'function') {
            this.onLoad(this);
        }
    }

    /**
     * Обработка списка
     * @param list - Список
     */
    private _handleList(list: any) {
        let model: any;
        for (let i = 0; i < list.length; i++) {
            this.Add(list[i]);

            if (!list[i][this.parentIdParam] || list[i][this.parentIdParam] === this._nullGuid) {
                model = this.data.list[this.data.list.length - 1];
            } else if (this.isTree) {
                model = this.GetById(list[i][this.idParam]);
            }

            if (model) {
                if (model[this.children]) {
                    this.isTree = true;
                    this._handleChildren(model);
                }
            }
        }
    }

    /**
     * Обработка детей
     * @param model - Элемент списка
     * @param search - true - метод будет искать дочерний элемент по запросу метода Search
     * @param properties - набор свойств необходимых для поиска дочерних элементов
     */
    private _handleChildren(model: any, search: boolean = false, properties?: any) {
        if (!search) model[this.children] = [...model[this.children]];
        let children = model[this.children];
        for (let i = 0; i < children.length; i++) {
            if (search) {
                this._findChild(children[i], properties);
            } else {
                children[i] = this._getDataItem(children[i]);
            }
            if (children[i][this.children]) {
                this._handleChildren(children[i]);
            }
        }
    }

    /**
     * Проверка дочернего элемента на соответствие поискового запроса
     * @param child - модель дочернего элемента
     * @param properties - набор свойств необходимых для поиска дочерних элементов
     */
    private _findChild(child: any, properties: any) {
        if (child[properties.param].toLowerCase().includes(properties.value.toLowerCase())) {
            properties.found.push(child);
        }
    }

    /**
     * Получаем DataItem
     * @param model - модель элемента
     * @return - DataItem
     */
    private _getDataItem(model: any) {
        let dataItem = new DPElements.DataItem(model);
        dataItem.onChange = (model: any, name: string, value: any) => {
            if (typeof this.onChange === 'function') {
                this.onChange(model, name, value);
            }
        };

        return dataItem;
    }

    /**
     * Получаем запись по идентификатору или уникальному идентификатору из дерева массивов
     * @param list - список
     * @param value - значение параметра
     * @param param - id или uid, по умолчанию - id
     */
    private _findModelFromTree(list: any, value: string, param: string = 'id') {
        let valueParam = this.idParam;
        if (param === 'uid') valueParam = 'uid';
        if (list?.length) {
            for (let i = 0; i < list.length; i++) {
                if (list[i][valueParam] === value) {
                    return list[i];
                } else {
                    if (list[i][this.children]?.length) {
                        const foundItem: any = this._findModelFromTree(
                            list[i][this.children],
                            value,
                            valueParam
                        );
                        if (foundItem) return foundItem;
                    }
                }
            }
        }
    }

    /**
     * Удаление элементов в древовидном массиве
     * @param model - модель удаляемого элемента
     */
    private _removeInTree(model: any) {
        if (model[this.parentIdParam] && model[this.parentIdParam] !== this._nullGuid) {
            let parentModel = this.GetById(model[this.parentIdParam]);
            if (parentModel[this.children]) {
                this._removeModel(parentModel[this.children], model);
            }
        } else {
            this._removeModel(this.data.list, model);
        }
    }

    /**
     * Удаление элементов в одномерном массиве
     * @param id - идентификатор удаляемого элемента
     */
    private _removeInList(id: string) {
        let results: Array<any> = [];
        let list: Array<any> = [];

        let resultsId = this._findIdChildren([id]);
        for (let model of this.data.list) {
            if (resultsId.indexOf(model[this.idParam]) === -1) {
                list.push(model);
            } else {
                results.push(model);
            }
        }
        this.data.list = list;

        return results;
    }

    /**
     * Поиск идентификаторов дочерних элементов для их удаления
     * @param list - список
     * @param model - модель элемента, который нужно удалить
     */
    private _removeModel(list: any, model: any) {
        let index = list.indexOf(model);
        if (index !== -1) list.splice(index, 1);
    }

    /**
     * Поиск идентификаторов дочерних элементов для их удаления
     * @param parentIds - родительские идентификаторы
     * @param list - пустой список
     */
    private _findIdChildren(parentIds: Array<string>, list: Array<string> = []) {
        const newIdsArray = [] as Array<any>;
        let result = list;

        for (let model of this.data.list) {
            const isChild = parentIds.indexOf(model[this.parentIdParam]) !== -1;

            if (isChild) {
                newIdsArray.push(model[this.idParam]);
            }
        }

        if (newIdsArray.length) {
            result = [...parentIds, ...result, ...newIdsArray];
            result = this._findIdChildren(newIdsArray, result);
        } else {
            result = parentIds;
        }

        return [...new Set(result)];
    }

    /**
     * Добавить запись
     * @param model
     */
    public Add(model: any) {
        if (this.data.list) {
            model = this._getDataItem(model);
            model.index = this.data.list.length;

            if (this.isTree) {
                if (model[this.parentIdParam]) {
                    const parent = this.GetById(model[this.parentIdParam]);
                    if (parent) {
                        if (!parent[this.children]) {
                            parent[this.children] = [];
                        }
                        parent[this.children].push(model);
                    } else {
                        this.data.list.push(model);
                    }
                } else {
                    this.data.list.push(model);
                }
            } else {
                this.data.list.push(model);
            }
        }

        if (typeof this.onAdd === 'function') {
            this.onAdd(model);
        }
    }

    /**
     * Добавить пустую запись
     * @param model
     */
    public AddEmpty(model: any) {
        if (this.data.list) {
            model = this._getDataItem(model);

            if (this.isTree) {
                if (model[this.parentIdParam]) {
                    const parent = this.GetById(model[this.parentIdParam]);
                    if (parent) {
                        if (!parent[this.children]) {
                            parent[this.children] = [];
                        }
                        parent[this.children].unshift(model);
                    } else {
                        this.data.list.unshift(model);
                    }
                } else {
                    this.data.list.unshift(model);
                }
            } else {
                this.data.list.unshift(model);
            }
        }

        if (typeof this.onAddEmpty === 'function') {
            this.onAddEmpty(model);
        }
    }

    /**
     * Добавить список записей
     * @param list - список
     */
    public AddRange(list: any) {
        if (list?.length) {
            this._handleList(list);
        }
    }

    /**
     * Редактировать запись
     * @param model
     */
    public Edit(model: any) {
        if (model[this.idParam]) {
            if (this.data.list) {
                let item = this.GetById(model[this.idParam]);

                if (item) {
                    for (let index in model) {
                        item[index] = model[index];
                    }
                }
            }
        }

        if (typeof this.onEdit === 'function') {
            this.onEdit(model);
        }
    }

    /**
     * Удалить запись
     * @param id - Идентификатор
     */
    public Remove(id: string) {
        let results: Array<any> = [];
        let result = false;
        if (id) {
            if (this.data.list) {
                let model = this.GetById(id);

                if (model) {
                    result = model;

                    if (this.isTree) {
                        this._removeInTree(model);
                    } else {
                        results = this._removeInList(id);
                    }

                    if (typeof this.onRemove === 'function') {
                        this.onRemove(result, results);
                    }
                }
            }
        }
    }

    /**
     * Получаем запись по идентификатору
     * @param id - идентификатор
     */
    public GetById(id: string) {
        if (id) {
            if (this.data.list) {
                let item: any;
                if (this.isTree) {
                    item = this._findModelFromTree(this.data.list, id);
                } else {
                    item = this.data.list.find(
                        (s: { [x: string]: string; }) => s[this.idParam] === id
                    );
                }
                if (item) {
                    return item;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Получаем запись по уникальному идентификатору
     * @param uid - уникальный идентификатор
     */
    public GetByUid(uid: string) {
        if (uid) {
            if (this.data.list) {
                let item: any;
                if (this.isTree) {
                    item = this._findModelFromTree(this.data.list, uid, 'uid');
                } else {
                    item = this.data.list.find((s: { [x: string]: string; }) => s['uid'] === uid);
                }
                if (item) {
                    return item;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Получаем запись по индексу
     * @param index
     */
    public GetByIndex(index: number): any {
        if (index >= 0) {
            if (this.data.list) {
                if (this.data.list.length >= index + 1) {
                    return this.data.list[index];
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Получаем индекс по идентификатору или по любому другому параметру
     * @param value - значение параметра
     * @param param - параметр, по умолчанию id
     */
    public GetIndexById(value: string, param: string = this.idParam) {
        if (value) {
            let index = 0;
            if (this.data.list) {
                for (let item of this.data.list) {
                    index++;
                    if (item[param] === value) {
                        return index - 1;
                    }
                }
            }
            return index;
        } else {
            return -1;
        }
    }

    /**
     * Сортировать список
     * @param param - название свойства списка
     * @param asc  - Сортировка по возрастанию или нет, true - по умолчание
     */
    public Sort(param: string, asc: boolean = true) {
        const list = this.data.list;

        if (asc) {
            list.sort((a: any, b: any) => (a[param] > b[param] ? 1 : -1));
        } else {
            list.sort((a: any, b: any) => (a[param] < b[param] ? 1 : -1));
        }

        if (typeof this.onSort === 'function') {
            this.onSort(list);
        }
    }

    /**
     * Найти элементы по имени
     * @param value - значение поискового запроса
     * @param param - название свойства списка
     * @return [] массив найденных моделей
     */
    public Search(value: string, param: string = 'name') {
        let found = [];
        let list = this.data.list;
        if (list?.length) {
            for (let i = 0; i < list.length; i++) {
                if (list[i][param].toLowerCase().includes(value.toLowerCase())) {
                    found.push(list[i]);
                } else {
                    if (list[i][this.children!]) {
                        this._handleChildren(list[i], true, {
                            value: value,
                            param: param,
                            found: found
                        });
                    }
                }
            }
        }
        return found;
    }

    /**
     * Найти элементы по имени
     * @param value - значение поискового запроса
     * @param param - название свойства списка
     * @return Promise
     */
    public async SearchAsync(value: string, param: string = 'name') {
        return new Promise((resolve, reject) => {
            const found = this.Search(value);
            resolve(found);
        });
    }

    /**
     * сортировка data.list по параметрам
     * @param arrayOfSortingParameters - массив параметров сортировки
     */
    SortMulti(arrayOfSortingParameters: Array<any>, list?: Array<any>) {
        if (arrayOfSortingParameters.length === 0) {
            this.Sort('index');

            return;
        }

        const sortingCallback = this.GetSortingCallback(arrayOfSortingParameters);

        let dataList = [];

        if (!list) dataList = this.data.list;
        if (list) dataList = list;

        dataList.sort(sortingCallback);

        if (typeof this.onSort === 'function' && !list?.length) {
            this.onSort(dataList);
        }
    }

    /**
     * генерируем callback функцию для метода sort массивов
     * @param arrayOfSortingParameters - массив параметров сортировки
     */
    GetSortingCallback(arrayOfSortingParameters: Array<any>) {
        const that = this;

        return function (a: any, b: any) {
            let result = 0;

            for (let item of arrayOfSortingParameters) {
                result = that.GetComparisonResult(item.field, item.direction)(a, b);

                if (result !== 0) {
                    return result;
                }
            }

            return result;
        };
    }

    /**
     * сравниваем модели и узнаем их позицию относительно друг друга
     * @param field - поле сравнения моделей
     * @param direction - направление сортировки
     * @returns позицию моделей относительно друг друга
     */
    GetComparisonResult(field: string, direction: string) {
        return function (a: any, b: any) {
            if (a === null || a === undefined) {
                return 1;
            }

            if (b === null || b === undefined) {
                return -1;
            }

            if (direction === 'desc') {
                return a[field] > b[field] ? -1 : a[field] < b[field] ? 1 : 0;
            } else {
                return a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0;
            }
        };
    }

    /**
     * заменяем массив моделей
     * @param list - новый массив моделей
     */
    SetData(list: Array<any> | null) {
        if (!list) {
            list = [];
        }

        this.Load(list);
    }
}

namespace DPElements {
    export const IconPath = './images/svg/dpicons.svg#';

    export class Global {
        static NewGuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }

        /**
         * Динамическое создание свойства get/set модели списка
         * @param component  - Компонент, передаем this класса модели
         * @param name  - Название свойства
         * @param value - значение свойства модели
         */
        static GetModelProperty(component: any, name: string, value: any) {
            if (!component[`_${name}`] && component[`_${name}`] !== false) {
                component[`_${name}`] = value;
                Object.defineProperty(component, name, {
                    get() {
                        return component[`_${name}`];
                    },
                    set(value: any) {
                        component[`_${name}`] = value;
                        component._setValue(name, value);
                    }
                });
            }
        }

        /**
         * Динамическое создание свойства get/set компоненту
         * @param component  - Компонент, передаем this
         * @param name  - Название свойства
         * @param _name  - название приватной переменной свойства:
         * @param property - false - только для чтения
         */
        static GetProperty(component: any, name: string, _name: string, property: boolean = true) {
            try {
                Object.defineProperty(component, name, {
                    get() {
                        return component[_name];
                    },
                    set(value: any) {
                        if (property === true) {
                            component._setProperty(name, value);
                        } else {
                            if (component.isRender === false) {
                                component[_name] = value;
                            } else {
                                throw new Error(`Свойство ${name} доступно только для чтения`);
                            }
                        }
                    }
                });
            } catch (e) { }
        }

        /**
         * Динамическое создание свойства get компоненту
         * @param component  - Компонент, передаем this
         * @param name  - Название свойства
         * @param _name  - название приватной переменной свойства:
         */
        static GetPropertyGetter(component: any, name: string, _name: string) {
            Object.defineProperty(component, name, {
                get() {
                    return component[_name];
                }
            });
        }

        /**
         * Проверяем свойство при инициализации
         * @param component - Компонент, передаем this
         * @param name - Название свойства
         * @param property -true в методе get передаём значение в SetProperty, false - записываем в переменную, по умолчанию true
         * @param full - true - создаем  get/set, false - создаем get
         */
        static CheckProperty(
            component: any,
            name: string,
            property: boolean = true,
            full: boolean = true
        ) {
            let type = typeof component[`_${name}`];
            if (component[name]) {
                let value = component[name];
                if (full === true) {
                    this.GetProperty(component, name, `_${name}`, property);
                    component[name] = value;
                } else {
                    this.GetPropertyGetter(component, name, `_${name}`);
                    component[`_${name}`] = value;
                }
            }
            if (component.getAttribute(name)) {
                let value = component.getAttribute(name);
                let result;

                if (value) {
                    switch (type) {
                        case 'string':
                            result = value;
                            break;
                        case 'number':
                            if (typeof Number(value) === 'number' && !isNaN(Number(value))) {
                                result = Number(value);
                            } else {
                                result = component[`_${name}`];
                            }
                            break;
                        case 'boolean':
                            switch (value) {
                                case 'true':
                                    result = true;
                                    break;
                                case 'false':
                                    result = false;
                                    break;
                                default:
                                    result = component[`_${name}`];
                                    break;
                            }
                            break;
                        case 'object':
                            if (component[`_${name}`] instanceof Date) {
                                let dateResult = this.CheckDate(value);
                                if (dateResult !== false) {
                                    result = dateResult;
                                } else {
                                    result = component[`_${name}`];
                                }
                            } else {
                                result = component[`_${name}`];
                            }
                            break;
                        default:
                            result = value;
                            break;
                    }
                }
                if (full === true) {
                    component[name] = result;
                } else {
                    component[`_${name}`] = result;
                }
            }
        }

        /**
         * Валидация даты и времени
         * @param value - Дата
         * @returns Дату в формате Date, в противном случае false
         */
        static CheckDate(value: string | Date): Date | boolean {
            try {
                if (typeof value !== 'string' && !isNaN(Date.parse(value.toString()))) {
                    return new Date(value);
                } else {
                    let split = value.toString().split(/[\s|,.:;]/g);
                    let dates: number[] = [];

                    let date: any = false;
                    if (split.length > 0) {
                        for (let numb of split) {
                            if (numb && numb !== '') {
                                dates.push(Number(numb));
                            }
                        }
                        switch (dates.length) {
                            case 3:
                                date = new Date(`${dates[1]}.${dates[0]}.${dates[2]}`);
                                break;
                            case 4:
                                date = new Date(`${dates[1]}.${dates[0]}.${dates[2]}`) as Date;
                                date.setHours(dates[3], '00', '00');
                                break;
                            case 5:
                                date = new Date(
                                    `${dates[1]}.${dates[0]}.${dates[2]}, ${dates[3]}:${dates[4]}`
                                );
                                break;
                            case 6:
                                date = new Date(
                                    `${dates[1]}.${dates[0]}.${dates[2]}, ${dates[3]}:${dates[4]}:${dates[5]}`
                                );
                                break;
                        }
                    }

                    if (isNaN(Date.parse(date.toString()))) {
                        return false;
                    }

                    return date;
                }
            } catch (e) {
                console.log(e);
                return false;
            }
        }
    }

    export class Coordinate {
        width: number;
        height: number;
        top: number;
        left: number;
        bottom: number;
        right: number;
        windowWidth: number;
        windowHeight: number;
        distanceOnRight: number;
        distanceOnBottom: number;
        calcBottom: number;
        calcTop: number;
        popupHeight: number;
        popupWidth: number;

        constructor(element: HTMLElement, popup?: HTMLElement) {
            let elementRect = element.getBoundingClientRect();
            this.width = element.offsetWidth;
            this.height = element.offsetHeight;
            this.top = elementRect.top;
            this.left = elementRect.left;
            this.bottom = elementRect.bottom;
            this.right = elementRect.right;
            this.windowWidth = document.documentElement.clientWidth;
            this.windowHeight = document.documentElement.clientHeight;
            this.distanceOnRight = this.windowWidth - this.right;
            this.distanceOnBottom = this.windowHeight - this.bottom;
            this.calcBottom = this.windowHeight - this.top;
            this.calcTop = this.top + this.height;
            this.popupHeight = popup?.offsetHeight || 0;
            this.popupWidth = popup?.offsetWidth || 0;
        }
    }

    export class DataItem {
        public onChange: Function | undefined;
        public onLoad: Function | undefined;
        private _DataElement: HTMLElement | undefined;
        private _isLoad: boolean | undefined;

        constructor(model: any) {
            for (const property in model) {
                Global.GetModelProperty(this, property, model[property]);
            }
            Global.GetModelProperty(this, 'disabled', false);
            Global.GetModelProperty(this, 'uid', DPElements.Global.NewGuid());
            Global.GetModelProperty(this, 'nestingLevel', 1);
            Global.GetModelProperty(this, 'expanded', false);
            Global.GetModelProperty(this, 'hasChildren', false);
        }

        private _setValue(name: string, value: any) {
            if (typeof this.onChange === 'function') {
                this.onChange(this, name, value);
            }
        }

        get DataElement(): HTMLElement | undefined {
            return this._DataElement;
        }

        set DataElement(value: HTMLElement | undefined) {
            this._DataElement = value;
        }

        get isLoad(): boolean | undefined {
            return this._isLoad;
        }

        set isLoad(value: boolean | undefined) {
            if (typeof this.onLoad === 'function') {
                this.onLoad();
            }
            this._isLoad = value;
        }
    }

    // import ResizeAndMoving = Control.ResizeAndMoving;

    export class TabGeneralMethods {
        el: any;
        onSelect: Function | undefined;
        onDisabled: Function | undefined;
        setSize: Function | undefined;
        updateSize: Function | undefined;
        changeVisible: Function | undefined;
        setContent: Function | undefined;
        setTab: Function | undefined;
        addListenersAndShowTabs: Function | undefined;

        private _tabButtonsElems: Array<HTMLElement>;
        classNameContent: string;

        Menu: HTMLElement | undefined;

        private _isHandler: boolean;

        constructor(el: any) {
            this.el = el;
            this._isHandler = false;
            this.classNameContent = '';
            this._tabButtonsElems = [];
        }

        /**
         * Выбираем активную вкладку
         * @param action - значение data-action кнопки
         * @param tabButtons - массив кнопок
         */
        async SetActiveTab(action: string, tabButtons: any) {
            return new Promise((resolve, reject) => {
                try {
                    if (this.el) {
                        if (!action) {
                            action = 'none';
                        }

                        const activeBlock = this.SetActiveContent(action, tabButtons);

                        if (typeof this.onSelect === 'function') {
                            this.onSelect(action);
                        } else {
                            if (this.dataSource?.data) {
                                this.el._select = this.dataSource.data.list.find((model: any) => model.action === action);
                            } else {
                                this.el._select = this.el._tabProperties.find((model: any) => model.action === action);
                            }
                        }

                        resolve(activeBlock);
                    }
                } catch (error) {
                    reject(error);
                }

            });
        }

        /**
         * Выбираем контент активной вкладки
         * @param action - значение data-action кнопки
         * @param tabButtons - массив кнопок
         */
        private SetActiveContent(action: string, tabButtons: any) {
            let activeBlock = false;
            if (this.el) {
                for (let item of this.el.children) {
                    let block = item as HTMLElement;
                    if (block.classList.contains(`${this.classNameContent}`)) {
                        for (let content of block.children) {
                            let contentBlock = content as HTMLElement;
                            if (contentBlock.dataset.action) {
                                if (contentBlock.dataset.action === action) {
                                    contentBlock.dataset.active = 'true';
                                    activeBlock = true;
                                } else {
                                    if (contentBlock.classList.contains('dp-modal')) {
                                        if (contentBlock.dataset.tab === 'true') {
                                            contentBlock.dataset.active = 'false';
                                        }
                                    } else {
                                        contentBlock.dataset.active = 'false';
                                    }
                                }
                            }
                        }
                    }
                }
            }

            this.SetActiveButton(action, activeBlock, tabButtons);

            return activeBlock;
        }

        /**
         * Выбираем кнопку активной вкладки
         * @param action - значение data-action кнопки
         * @param {boolean} activeBlock - активный блок
         * @param tabButtons - массив кнопок
         */
        private SetActiveButton(action: string, activeBlock: boolean, tabButtons: any) {
            for (let button of tabButtons) {
                let btn = button as HTMLButtonElement;
                if (btn.dataset.action) {
                    if (btn.dataset.action === action) {
                        if (activeBlock) {
                            if (btn.classList.contains('dp-tabs-button')) {
                                if (btn.parentElement) {
                                    btn.parentElement.dataset.active = 'true';
                                }
                            } else {
                                btn.dataset.active = 'true';
                            }
                            this.SetStatedOnMenuButtons(true, btn.dataset.action, false, false);
                            this.SetValueForTabProperty(btn.dataset.action, true, 'active');
                        } else {
                            if (btn.classList.contains('dp-tabs-button')) {
                                if (btn.parentElement) {
                                    btn.parentElement.dataset.active = 'false';
                                }
                            } else {
                                btn.dataset.active = 'false';
                            }
                            this.SetStatedOnMenuButtons(false, btn.dataset.action, false, false);
                            this.SetValueForTabProperty(btn.dataset.action, false, 'active');
                        }
                    } else {
                        if (btn.classList.contains('dp-tabs-button')) {
                            if (btn.parentElement) {
                                btn.parentElement.dataset.active = 'false';
                            }
                        } else {
                            btn.dataset.active = 'false';
                        }
                        this.SetStatedOnMenuButtons(false, btn.dataset.action, false, false);
                        this.SetValueForTabProperty(btn.dataset.action, false, 'active');
                    }
                }
            }
        }

        /**
         * Выбираем кнопку активной вкладки
         * @param action - значение data-action кнопки
         * @param value - значение активности вкладки
         * @param type - тип действия, 'active', 'disabled'
         */
        SetValueForTabProperty(action: string, value: boolean, type: string) {
            let model: any;
            if (this.dataSource?.data) {
                model = this.dataSource.data.list.find((item: any) => item.action === action);
            } else {
                model = this.tabProperties.find((item: any) => item.action === action);
            }
            if (model) {
                if (type === 'active') {
                    model.active = value;
                } else if (type === 'disabled') {
                    model.disabled = value;
                }
            }
        }

        /**
         * Обрабатываем текущий контент
         * @param tabButtons - массив кнопок
         * @param {boolean} position - true === вертикальная вкладка
         */
        ContentHandler(tabButtons: any, position: string) {
            this._tabButtonsElems = tabButtons;
            let action = null;
            let tabs = [];
            if (this.el) {
                for (let child of this.el.children) {
                    switch (child.tagName) {
                        case 'UL':
                            let count = 1;
                            for (let btn of tabButtons) {
                                if (position === 'bottom') {
                                    const buttonData = this.HandlerBottom(btn, tabButtons);
                                    if (buttonData) {
                                        tabs.push(buttonData);
                                        if (count === tabButtons.length) {
                                            this.el._dataSource = new DPDataSource({
                                                list: tabs
                                            });
                                            if (this.addListenersAndShowTabs) this.addListenersAndShowTabs(btn, true);
                                            this._setUid(tabButtons);
                                        }
                                    }
                                }

                                if (count === 1) action = btn.dataset.action;
                                count++;

                                this.SetTabProperties(btn);

                                if (position !== 'bottom') this.SetButtonType(this.el.buttonType);
                                if (this.setSize) this.setSize(btn);
                                if (this.addListenersAndShowTabs) this.addListenersAndShowTabs(btn, false);
                            }
                            break;
                        case 'DIV':
                            if (child.classList.contains('dp-vertical-tab-contents') ||
                                child.classList.contains('dp-bottom-tab-contents') ||
                                child.classList.contains('dp-top-tab-contents')) {
                                let content = child as HTMLElement;
                                if (this.el.position === 'right') {
                                    content.dataset.side = 'right';
                                }
                                this.classNameContent = child.className;
                                if (this.setContent) this.setContent(content);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }

            if (this.el.main) {
                if (this.setTab) this.setTab(this.el.main);
            } else {
                if (this.setTab) this.setTab(action);
            }
            this._isHandler = true;
        }

        /**
         * Задаем свойства вкладки в отдельный объект
         * @param btn - кнопка вкладки
         */
        SetTabProperties(btn: HTMLElement) {
            if (btn.dataset.action) {
                const properties: TabProperties = {
                    action: btn.dataset.action,
                    active: false,
                    disabled: false
                };
                this.el.tabProperties.push(properties);
            }
        }

        /**
         * Обработка нижних вкладок
         * @param btn - кнопка вкладки
         * @param tabButtons - массив кнопок
         */
        HandlerBottom(btn: HTMLElement, tabButtons: any) {
            if (!this.el.dataSource) {
                return {
                    id: DPElements.Global.NewGuid(),
                    name: btn.firstElementChild!.textContent,
                    action: btn.dataset.action,
                    active: false,
                    disabled: false
                };
            }
        }

        /**
         * Присваиваем уникальные идентификаторы кнопкам
         * @param tabButtons - массив кнопок
         */
        private _setUid(tabButtons: any) {
            for (let button of tabButtons) {
                for (let model of this.dataSource.data.list) {
                    if (model.action === button.dataset.action) {
                        button.dataset.uid = model.uid;
                        break;
                    }
                }
            }
        }

        /**
         * Переключаем состояние вкладки
         * @param tabButtons - массив кнопок
         * @param action - значение data-action кнопки
         * @param result - true - если отключить вкладку, false если включить
         */
        GeneralDisabledTab(tabButtons: any, action: string, result: boolean) {
            if (tabButtons.length) {
                for (let button of tabButtons) {
                    let btn = button as HTMLButtonElement | null;
                    if (btn) {
                        if (btn.dataset.action === action) {
                            btn.disabled = result;
                            this.SetStatedOnMenuButtons(result, btn.dataset.action, true, false);
                            if (result) {
                                this.SetValueForTabProperty(btn.dataset.action, true, 'disabled');
                                this.SetValueForTabProperty(btn.dataset.action, false, 'active');
                                if (btn.classList.contains('dp-tabs-button')) {
                                    if (btn.parentElement) {
                                        if (btn.parentElement.dataset.active === 'true') {
                                            btn.parentElement.dataset.active = 'false';
                                        }
                                    }
                                } else {
                                    if (btn.dataset.active === 'true') {
                                        btn.dataset.active = 'false';
                                    }
                                }
                            } else {
                                this.SetValueForTabProperty(btn.dataset.action, false, 'disabled');
                            }
                            this.SetDisabledRemoveButton(btn, result);
                        }
                    }
                }
            }
        }

        /**
         * Переключаем состояние вкладки в контекстном меню
         * @param action - значение data-action кнопки
         * @param {boolean} value - true - если отключить вкладку, false если включить
         * @param {boolean} onDisabled - true - нужно заблокировать, false - нужно сделать активным
         * @param {boolean } main - true - задан mainOnly
         */
        SetStatedOnMenuButtons(value: boolean, action: string, onDisabled: boolean, main: boolean) {
            const menuBtns = this.Menu?.querySelectorAll('.dp-menu-toggle-check');
            if (menuBtns) {
                for (let key of menuBtns) {
                    const button = key as HTMLButtonElement;
                    if (button.dataset.action === action) {
                        if (!onDisabled) {
                            button.dataset.active = `${value}`;
                        } else {
                            button.disabled = value;
                            button.dataset.active = 'false';
                        }
                    }
                }
            }
        }

        /**
         * Устанавливаем disabled для кнопки удаления
         * @param btn - кнопка вкладки
         * @param {boolean} value - true - отключить кнопку
         */
        private SetDisabledRemoveButton(btn: HTMLElement, value: boolean) {
            if (btn.nextElementSibling) {
                let siblingButton = btn.nextElementSibling as HTMLElement;
                if (value) {
                    siblingButton.style.pointerEvents = 'none';
                } else {
                    siblingButton.removeAttribute('style');
                }
            }
        }

        /**
         * Устанавливаем активным main, остальные вкладки блокируем
         * @param value {boolean} - true | false
         * @param tabButtons - массив кнопок
         */
        SetMainOnly(value: boolean, tabButtons: any) {
            this.SetActiveTab(this.el.main, tabButtons).then(() => {
                for (let button of tabButtons) {
                    let btn = button as HTMLButtonElement;
                    if (btn.dataset.action) {
                        if (btn.dataset.action === this.el.main) {
                            if (btn.classList.contains('dp-tabs-button')) {
                                if (btn.parentElement) {
                                    btn.parentElement.dataset.active = 'true';
                                }

                            } else {
                                btn.dataset.active = 'true';
                            }
                            btn.disabled = false;
                            this.SetStatedOnMenuButtons(false, btn.dataset.action, true, true);
                            this.SetValueForTabProperty(btn.dataset.action, false, 'disabled');
                            this.SetValueForTabProperty(btn.dataset.action, true, 'active');
                            this.SetDisabledRemoveButton(btn, false);
                        } else {
                            if (btn.classList.contains('dp-tabs-button')) {
                                if (btn.parentElement) {
                                    btn.parentElement.dataset.active = 'false';
                                }
                            } else {
                                btn.dataset.active = 'false';
                            }
                            btn.disabled = value;
                            this.SetStatedOnMenuButtons(value, btn.dataset.action, true, true);
                            this.SetValueForTabProperty(btn.dataset.action, value, 'disabled');
                            this.SetValueForTabProperty(btn.dataset.action, false, 'active');
                            this.SetDisabledRemoveButton(btn, value);
                        }
                    }
                }
            });
        }

        /**
         * Блокируем все вкладки
         * @param tabButtons - массив кнопок
         * @param value - true - отключить вкладки
         */
        SetDisabledTabs(tabButtons: any, value: boolean) {
            if (tabButtons.length) {
                for (let button of tabButtons) {
                    let btn = button as HTMLButtonElement;
                    if (btn.dataset.action) {
                        if (value) {
                            if (btn.classList.contains('dp-tabs-button')) {
                                if (btn.parentElement) {
                                    btn.parentElement.dataset.active = 'false';
                                }
                            } else {
                                btn.dataset.active = 'false';
                            }
                        }
                    }
                    btn.disabled = value;
                    if (btn.dataset.action) {
                        this.SetStatedOnMenuButtons(value, btn.dataset.action, true, false);
                        this.SetValueForTabProperty(btn.dataset.action, value, 'disabled');
                        this.SetValueForTabProperty(btn.dataset.action, value, 'active');
                    }
                }

                if (typeof this.onDisabled === 'function') {
                    this.onDisabled(value);
                }
            }
        }

        /**
         * @param tabButtons - массив кнопок
         * @param start - номер, от которого начинается отчет кнопок при проверке на блокировку
         * @param action - значение data-action кнопки
         */
        CheckDisabledButtons(start: number, tabButtons: any, action: string) {
            for (let i = start; i < tabButtons.length; i++) {
                if (!tabButtons[i].disabled) {
                    if (tabButtons[i].dataset.action !== action) return i;
                }
            }
            return 0;
        }

        /**
         * Задаем тип кнопки
         * @param type - тип кнопки (icon || name || full)
         */
        SetButtonType(type: string) {
            this.el._buttonType = type;
            const menuItems = this.Menu?.querySelectorAll('.dp-menu-toggle-check');
            for (let button of this._tabButtonsElems) {
                button.dataset.type = type;
            }
            if (menuItems) {
                for (let key of menuItems) {
                    const button = key as HTMLElement;
                    button.dataset.type = type;
                }
            }
            if (this._isHandler) this.UpdateTabsSize();
        }

        /** Обновляем размер вкладок после изменения их типа */
        UpdateTabsSize() {
            let sizes = [];
            for (let btn of this._tabButtonsElems) {
                if (btn.parentElement) {
                    if (btn.parentElement.dataset.visible === 'false') {
                        btn.parentElement.dataset.visible = 'true';
                        if (this.el.position === 'left' || this.el.position === 'right') {
                            sizes.push(btn.offsetHeight);
                        } else {
                            sizes.push(btn.offsetWidth);
                        }
                        btn.parentElement.dataset.visible = 'false';
                    } else {
                        if (this.el.position === 'left' || this.el.position === 'right') {
                            sizes.push(btn.offsetHeight);
                        } else {
                            sizes.push(btn.offsetWidth);
                        }
                    }
                }
            }
            if (this.updateSize) this.updateSize(sizes);
            for (let i = 0; i < this._tabButtonsElems.length; i++) {
                if (this.changeVisible) this.changeVisible();
            }
        }


        get dataSource() {
            return this.el.data;
        }

        set dataSource(value: DPDataSource) {
            this.el._dataSource = value;
        }

        get tabProperties() {
            return this.el.tabProperties;
        }

        set buttonType(value: string) {
            this.SetButtonType(value);
        }
    }

    export class TabResize {
        tabBarTabs: Array<HTMLElement>;
        menuTabs: Array<HTMLElement>;
        elementsSize: Array<number>;
        position: string;

        private _tabBarSize: number;
        private _tabsSize: number;
        private _isOpenContextMenu: boolean;
        private _isVertical: boolean;
        private _sizeParam: string;


        private _TabBar: HTMLElement | undefined;
        contextMenu: HTMLElement | undefined;
        ContextList: HTMLElement | undefined;
        ContextMenuBtn: HTMLElement | undefined;

        constructor(tabBar: HTMLElement, isVertical: boolean, position: string) {
            this._isVertical = isVertical;
            this.contextMenu = this.CreateContextMenu();
            this._TabBar = tabBar;
            this.elementsSize = [];
            this.tabBarTabs = [];
            this.menuTabs = [];
            this._tabsSize = 0;
            this.position = position;
            this._isOpenContextMenu = false;
            this._sizeParam = '';

            document.body.append(this.contextMenu);

            if (isVertical) {
                this._tabBarSize = tabBar.offsetHeight;
            } else {
                this._tabBarSize = tabBar.offsetWidth;
            }
            if (this._TabBar) {
                this.AddItemsToContextMenu();
            }
        }

        /**
         * Закрывает контексное меню при клике вне его
         * @param e - событие указателя
         */
        ClickOutsideBlock = (e: Event) => {
            const target = e.target as HTMLElement;
            if (
                !target.closest('.dp-context-menu-tab') &&
                !target.closest('.dp-tab-context-button')
            ) {
                this.CloseContextMenu();
            }
        };

        /** Добавляем вкладки в контексное меню и в массивы */
        AddItemsToContextMenu() {
            if (this._TabBar) {
                this.tabBarTabs = [...this._TabBar.children] as Array<HTMLElement>;
            }

            if (this.tabBarTabs.length > 1) {
                if (this.position === 'bottom') {
                    this.tabBarTabs.splice(0, 1);
                }
                for (let i = 0; i < this.tabBarTabs.length; i++) {
                    let item = this.tabBarTabs[i].cloneNode(true);
                    if (this.ContextList) {
                        this.ContextList.append(item);
                        this.menuTabs = [...this.ContextList.children] as Array<HTMLElement>;
                    }
                    this.tabBarTabs[i].setAttribute('data-uid', `${i}`);
                    this.tabBarTabs[i].setAttribute('data-visible', `true`);
                    this.menuTabs[i].setAttribute('data-uid', `${i}`);
                    this.menuTabs[i].setAttribute('data-visible', `false`);
                }
                this.AddClasses();
            } else {
                this.tabBarTabs = [];
                this.menuTabs = [];
            }
        }

        /** Добавляем классы для вкладок меню */
        AddClasses() {
            for (let i = 0; i < this.menuTabs.length; i++) {
                let child: HTMLElement | null;
                let name: HTMLElement | null;
                this.menuTabs[i].classList.add('dp-menu-list-item');
                if (this.position === 'bottom') {
                    this.menuTabs[i].classList.remove('dp-bottom-tab-item');
                    child = this.menuTabs[i].querySelector('.dp-bottom-tab-button');
                    child?.classList.remove('dp-bottom-tab-button');
                    child?.classList.add('dp-menu-toggle-check');
                } else if (this.position === 'top') {
                    this.menuTabs[i].classList.remove('dp-tabs-link');
                    child = this.menuTabs[i].querySelector('.dp-tabs-button');
                    child?.classList.remove('dp-tabs-button');
                    child?.classList.add('dp-menu-toggle-check');
                } else {
                    this.menuTabs[i].classList.remove('dp-vertical-tab-item');
                    child = this.menuTabs[i].querySelector('.dp-vertical-tab-button');
                    child?.classList.remove('dp-vertical-tab-button');
                    child?.classList.add('dp-menu-toggle-check');
                }

                name = this.menuTabs[i].querySelector('.dp-tab-button-name');
                name?.classList.remove('dp-tab-button-name');
                name?.classList.add('dp-menu-toggle-text');
            }
        }

        /** Обновляем данные при поступлении новых данных */
        UpdateData() {
            this.tabBarTabs = [];
            this.menuTabs = [];
            if (this.ContextList) this.ContextList.innerHTML = '';
            if (this._TabBar) {
                this.AddItemsToContextMenu();
            }
        }

        /**
         * Следим за имзенением размера основной области вкладок
         * @param elementsSize - размер вкладок
         */
        WatchWidthChange(elementsSize: Array<number>) {
            const ro = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    let size = 0;
                    if (this._TabBar) {
                        this._isVertical ? (size = this._TabBar.offsetHeight) : (size = this._TabBar.offsetWidth);
                    }

                    if (entry.target === this._TabBar && size > 0) {
                        const difference = size - this._tabBarSize;
                        if (Math.abs(difference) > 1) {
                            this.ChangeVisibleItems(elementsSize);
                            this.SetPosition();
                        }
                    }
                }
            });
            this.elementsSize = elementsSize;
            if (this._TabBar) ro.observe(this._TabBar);
        }

        /** Расчитываем общей области табов */
        CalcTabSize() {
            if (this._TabBar) {
                if (this._isVertical) {
                    return this._TabBar.offsetHeight - 60;
                } else if (!this._isVertical && this.position === 'bottom') {
                    return this._TabBar.offsetWidth - 95;
                } else {
                    return this._TabBar.offsetWidth - 60;
                }
            }
        }

        /**
         * Изменеям видимость вкладок при изменения размера
         * @param elementsSize - размер вкладок
         */
        ChangeVisibleItems(elementsSize: Array<number>) {
            let tabsSize = 0;
            let uid: string | undefined;
            const visibleItems = this.tabBarTabs.filter(
                (item: HTMLElement) => item.dataset.visible === 'true'
            );
            let tabBarSize = this.CalcTabSize();

            if (elementsSize.length && !this.elementsSize.length || this.elementsSize[0] === 0) {
                if (elementsSize[0] === 0) {
                    let tabItemsSize = [];
                    for (let item of this.tabBarTabs) {
                        if (this._isVertical) {
                            tabItemsSize.push(item.offsetHeight);
                        } else {
                            tabItemsSize.push(item.offsetWidth);
                        }
                        this.elementsSize = tabItemsSize;
                    }
                } else {
                    this.elementsSize = elementsSize;
                }
            }

            for (let btn of visibleItems) {
                let button = btn as HTMLElement;
                this._isVertical
                    ? (tabsSize += button.offsetHeight)
                    : (tabsSize += button.offsetWidth);
            }
            if (tabBarSize) {
                if (tabBarSize < tabsSize) {
                    this.AddContextMenuButton();
                    if (visibleItems.length) {
                        visibleItems[visibleItems.length - 1].dataset.visible = 'false';
                        uid = visibleItems[visibleItems.length - 1].dataset.uid;
                    }

                    for (let i = 0; i < this.menuTabs.length; i++) {
                        if (this.menuTabs[i].dataset.uid === uid) {
                            this.menuTabs[i].dataset.visible = 'true';
                            break;
                        }
                    }
                } else {
                    for (let i = 0; i < this.tabBarTabs.length; i++) {
                        if (this.tabBarTabs[i].dataset.visible === 'false') {
                            if (tabBarSize - tabsSize > this.elementsSize[i]) {
                                this.tabBarTabs[i].dataset.visible = 'true';
                                this.menuTabs[i].dataset.visible = 'false';
                                break;
                            }
                        }
                    }
                }
                if (this.CheckVisibleItemsInMenu()) {
                    this.RemoveContextMenuButton();
                }
            }
        }

        /** Проверяем есть ли видимые вкладки в меню
         * @return - true если нет видимых вкладок в меню
         * */
        CheckVisibleItemsInMenu() {
            if (this.menuTabs.length) {
                const visibleTab = this.menuTabs.find(item => item.dataset.visible === 'true');
                if (!visibleTab) {
                    return true;
                }
            } else {
                return true;
            }
            return false;
        }

        /**
         *  Показываем вкладки в меню и скрываем их из основной области
         *  @param item - вкладка
         *  @param elementsSize - размеры вкладок
         */
        ShowTabsInContextMenu(item: HTMLElement, elementsSize: Array<number>) {
            this.elementsSize = elementsSize;
            const tabBarSize = this.CalcTabSize();

            if (this._isVertical) {
                this._tabsSize += item.offsetHeight;
            } else {
                this._tabsSize += item.offsetWidth;
            }

            if (tabBarSize) {
                if (this._tabsSize > tabBarSize && tabBarSize > 0) {
                    this.AddContextMenuButton();

                    for (let list of this.tabBarTabs) {
                        if (item.dataset.uid === list.dataset.uid) {
                            list.dataset.visible = 'false';
                            break;
                        }
                    }
                    for (let list of this.menuTabs) {
                        if (item.dataset.uid === list.dataset.uid) {
                            list.dataset.visible = 'true';
                            break;
                        }
                    }
                    if (this.position === 'bottom') this.ShowTabsInVisibilityArea(item);
                } else if (this.position === 'bottom') {
                    this.AddTabsToFreeSpace(tabBarSize);
                }
                if (this.position !== 'bottom') this.AddTabsToFreeSpace(tabBarSize);
            }
        }

        /**
         * Показывает вкладку в области видимости и убирает последние вкладки в меню при нехватке места.
         * @param item - вкладка, которая находится в контекст меню
         */
        ShowTabsInVisibilityArea(item: HTMLElement) {
            const visibleTabs = this.FilterVisibleTabs();
            let tabsSize = this.CalcSizeAfterFilter(visibleTabs);

            for (let i = 0; i < this.tabBarTabs.length; i++) {
                let tabItem = this.tabBarTabs[i];
                let menuItem = this.menuTabs[i];
                if (tabItem.dataset.uid === item.dataset.uid) {
                    tabItem.dataset.visible = 'true';
                    menuItem.dataset.visible = 'false';

                    if (this._isVertical) {
                        tabsSize += tabItem.offsetHeight;
                    } else {
                        tabsSize += tabItem.offsetWidth;
                    }

                    const tabBarSize = this.CalcTabSize();
                    this.ChangeVisibilityOnClick(tabBarSize!, tabsSize, visibleTabs);
                }
            }

            if (this.CheckVisibleItemsInMenu()) {
                this.RemoveContextMenuButton();
            }
            this.SetPosition();

        }

        /**
         * Изменяем видимость вкладок при клике на них
         * @param tabBarSize - размер всего элемента
         * @param tabsSize - размер вкладки
         * @param visibleTabs - массив из видимых элементов
         */
        ChangeVisibilityOnClick(tabBarSize: number, tabsSize: number, visibleTabs: Array<HTMLElement>) {
            let item: HTMLElement;
            for (let i = 1; tabBarSize <= tabsSize; i++) {
                if (visibleTabs.length) {
                    item = visibleTabs[visibleTabs.length - i] as HTMLElement;
                    if (item) {
                        if (this._isVertical) {
                            tabsSize -= item.offsetHeight;
                            item.dataset.visible = 'false';
                        } else {
                            tabsSize -= item.offsetWidth;
                            item.dataset.visible = 'false';
                        }

                        tabBarSize = this.CalcTabSize()!;

                        for (let elem of this.menuTabs) {
                            if (elem.dataset.uid === item.dataset.uid) {
                                elem.dataset.visible = 'true';
                                break;
                            }
                        }
                        this.AddTabsToFreeSpace(tabBarSize);
                    } else {
                        const visibleItem = this.FilterVisibleTabs();
                        if (visibleItem.length === 1) {
                            visibleItem[0].dataset.visible = 'false';
                            const menuItem = this.menuTabs.find(item => item.dataset.uid === visibleItem[0].dataset.uid);
                            if (menuItem) menuItem.dataset.visible = 'true';
                        }
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        AddTabsToFreeSpace(tabBarSize: number) {
            const visibleTabs = this.FilterVisibleTabs();
            let tabsSize = this.CalcSizeAfterFilter(visibleTabs);
            if (tabBarSize > tabsSize) {
                for (let i = 0; i < this.tabBarTabs.length; i++) {
                    if (this.tabBarTabs[i].dataset.visible === 'false') {
                        if (tabBarSize - tabsSize > this.elementsSize[i]) {
                            this.tabBarTabs[i].dataset.visible = 'true';
                            this.menuTabs[i].dataset.visible = 'false';
                            if (this._isVertical) {
                                tabsSize += this.tabBarTabs[i].offsetHeight;
                            } else {
                                tabsSize += this.tabBarTabs[i].offsetWidth;
                            }
                        }
                    }
                }
            }
        }

        FilterVisibleTabs() {
            return this.tabBarTabs.filter(
                (tabItem: HTMLElement) => tabItem.dataset.visible === 'true'
            );
        }

        CalcSizeAfterFilter(visibleItems: Array<HTMLElement>) {
            let tabsSize = 0;
            if (visibleItems.length) {
                for (let key of visibleItems) {
                    let item = key as HTMLElement;
                    this._isVertical
                        ? (tabsSize += item.offsetHeight)
                        : (tabsSize += item.offsetWidth);
                }
            }
            return tabsSize;
        }

        /** Добавляем кнопку меню */
        AddContextMenuButton() {
            if (!this.ContextMenuBtn && this._TabBar) {
                this.ContextMenuBtn = this.CreateContextMenuButton();
                this._TabBar.append(this.ContextMenuBtn);
            }
        }

        /**Получаем кнопку, которая появляется при нехватке места  */
        CreateContextMenuButton() {
            let contextMenuBtn = document.createElement('button');
            contextMenuBtn.classList.add('dp-tab-context-button');
            if (this.position === 'top') {
                contextMenuBtn.classList.add('dp-top-tab-context-button');
            } else if (this.position === 'bottom') {
                contextMenuBtn.classList.add('dp-bottom-tab-context-button');
            }
            for (let i = 0; i < 3; i++) {
                let span = document.createElement('span');
                contextMenuBtn.append(span);
            }
            contextMenuBtn.addEventListener('click', () => {
                this.ToggleContextMenu();
                this.SetPosition();
            });

            return contextMenuBtn;
        }

        /** Удаляет кнопку контексного меню */
        RemoveContextMenuButton() {
            if (this.ContextMenuBtn) {
                this.CloseContextMenu();
                this.ContextMenuBtn.remove();
                this.ContextMenuBtn = undefined;
            }
        }

        /** Переключаем состояние меню, открытие или закрытое */
        ToggleContextMenu() {
            if (this._isOpenContextMenu) {
                this.CloseContextMenu();
            } else {
                if (this.contextMenu) {
                    this._isOpenContextMenu = true;
                    this.contextMenu.dataset.active = 'true';
                }
                document.addEventListener('click', this.ClickOutsideBlock, { capture: true });
            }
        }

        /** Закрываем контексное меню */
        CloseContextMenu() {
            if (this._isOpenContextMenu) {
                if (this.contextMenu) {
                    this._isOpenContextMenu = false;
                    this.contextMenu.dataset.active = 'false';
                    document.removeEventListener('click', this.ClickOutsideBlock, { capture: true });
                }
            }
        }

        /** Создаем контексное меню */
        CreateContextMenu() {
            let context = document.createElement('div');
            context.classList.add('dp-context-menu');
            this.ContextList = document.createElement('ul');
            this.ContextList.classList.add('dp-menu-list');
            context.append(this.ContextList);
            return context;
        }

        /** Задаем позицию для меню */
        SetPosition() {
            if (this._TabBar && this.contextMenu) {
                const coordinate = new Coordinate(this._TabBar, this.contextMenu);
                if (this.position === 'left') {
                    this.contextMenu.style.top = `${coordinate.bottom - coordinate.popupHeight - 20}px`;
                    this.contextMenu.style.left = `${coordinate.right}px`;
                } else if (this.position === 'right') {
                    this.contextMenu.style.top = `${coordinate.bottom - coordinate.popupHeight - 20}px`;
                    this.contextMenu.style.left = `${coordinate.left - coordinate.popupWidth - 5}px`;
                } else if (this.position === 'bottom') {
                    this.contextMenu.style.top = `${coordinate.top - coordinate.popupHeight}px`;
                    this.contextMenu.style.right = `${coordinate.distanceOnRight}px`;
                } else if (this.position === 'top') {
                    this.contextMenu.style.top = `${coordinate.top + coordinate.height}px`;
                    this.contextMenu.style.right = `${coordinate.distanceOnRight}px`;
                }
            }
        }
    }

    export class GeneralVerticalTab extends TabGeneralMethods {
        DeltaX: number;
        el: any;
        onState: Function | undefined;
        onModal: Function | undefined;
        onResize: Function | undefined;

        elementsHeight: Array<number>;
        modalWindowSides: Array<string>;
        tabButtons: NodeListOf<HTMLElement> | undefined;
        contentWidth: number;

        Resizer: HTMLElement;
        Content: HTMLElement | undefined;
        ActiveButton: HTMLElement | undefined;
        VerticalTab: HTMLElement | null;
        resizeComponent: DPElements.TabResize | undefined;

        constructor(el: any) {
            super(el);
            this.el = el;
            this.Resizer = this.GetResizerBlock();
            this.VerticalTab = null;
            this.elementsHeight = [];
            this.modalWindowSides = [];
            this.contentWidth = 0;
            this.DeltaX = 0;
            this.Initialize();
        }

        /** Инициализация компоненты */
        Initialize() {
            if (this.el) {
                this.el.append(this.Resizer);
                this.modalWindowSides = ['top', 'bottom', 'left', 'right', 'topleft', 'topright', 'bottomleft', 'bottomright'];
                this.contentWidth = window.innerWidth;
                this.VerticalTab = this.el.querySelector('.dp-vertical-tab');
                this.tabButtons = this.el.querySelectorAll('.dp-vertical-tab-button');
                if (this.VerticalTab) {
                    this.resizeComponent = new DPElements.TabResize(this.VerticalTab, true, this.el.position);
                }
                if (this.resizeComponent) {
                    super.Menu = this.resizeComponent.contextMenu;
                }
                this.AddListenerForMenuTabs();
                this.InitMethodsForContentHandler();
                super.ContentHandler(this.tabButtons, 'vertical');
                window.addEventListener('resize', (e) => this.ResizeChanged(e));
                if (this.resizeComponent) this.resizeComponent.WatchWidthChange(this.elementsHeight);
                this._createModalWindows();
            }

        }

        /** Инициализируем функции предназначенные для вызова в TabGeneralMethods.ContentHandler */
        InitMethodsForContentHandler() {
            /** Задается обработчики кнопкам и  */
            super.addListenersAndShowTabs = (btn: HTMLElement) => {
                this.AddListenerToTabButton(btn);
                if (this.resizeComponent && btn.parentElement) {
                    this.resizeComponent.ShowTabsInContextMenu(btn.parentElement, this.elementsHeight);
                }
            };
            /** Изменяется видимость вкладок при изменении типа кнопки, иконка или имя. */
            super.changeVisible = () => {
                if (this.resizeComponent) {
                    this.resizeComponent.WatchWidthChange(this.elementsHeight);
                    this.resizeComponent.ChangeVisibleItems(this.elementsHeight);
                }
            };
            /** Устанавливаются размеры вкладок */
            super.setSize = (btn: HTMLElement) => {
                if (btn.parentElement) {
                    this.elementsHeight.push(btn.parentElement.offsetHeight);
                }
            };
            /** устанавливается контент */
            super.setContent = (content: HTMLElement) => this.Content = content;
            /** устанавливается активная вкладка */
            super.setTab = (action: string) => this.tab = action;
            /** Обновляем размер вкладок при изменение типа кнопок */
            super.updateSize = (updDate: Array<number>) => this.elementsHeight = updDate;
        }

        /** Добавляем слушатель событий на вкладки контексного меню */
        AddListenerForMenuTabs() {
            if (this.resizeComponent) {
                for (let elem of this.resizeComponent.menuTabs) {
                    let child = elem.querySelector('.dp-menu-toggle-check') as HTMLElement;
                    child.addEventListener('click', (e) => this.SelectTab(e));
                }
            }
        }

        /**
         * Добавляем слушатели событий на кнопку вкладки
         * @param button - кнопка вкладки
         */
        AddListenerToTabButton(button: HTMLElement) {
            button.addEventListener('click', (e) => this.SelectTab(e));
            button.addEventListener('dblclick', (e) => this.SelectTabDblClick(e));

            let time: number;

            button.addEventListener('pointerdown', (e) => {
                time = setTimeout(() => {
                    this.ShowModalWindow(e);
                }, 3000);
            });
            button.addEventListener('pointerup', () => {
                clearTimeout(time);
            });
        }

        /** Создаем шапку модального окна */
        CreateModalHeader(move: any) {
            let modalWindowHeader = document.createElement('div');
            modalWindowHeader.classList.add('dp-modal-headed');
            modalWindowHeader.append(this.CreateModalTitleBlock(move), this.CreateModalHeaderButtons(move));
            return modalWindowHeader;
        }

        /** Создаем контейнер для заголовка модальноо окна */
        CreateModalTitleBlock(move: any) {
            let modalWindowTitleBlock = document.createElement('div');
            modalWindowTitleBlock.classList.add('dp-modal-title-blok');
            modalWindowTitleBlock.append(this.CreateModalTitle());

            modalWindowTitleBlock.addEventListener('pointerdown', (e) => move.BeginSliding(e));
            modalWindowTitleBlock.addEventListener('pointerup', (e) => move.StopSliding(e));

            return modalWindowTitleBlock;
        }

        /** Создаем заголовок модального окна */
        CreateModalTitle() {
            let modalWindowTitle = document.createElement('p');
            modalWindowTitle.classList.add('dp-modal-title');
            if (this.ActiveButton) {
                modalWindowTitle.innerText = this.ActiveButton.innerText;
            }
            return modalWindowTitle;
        }

        /** Создаем кнопки в шапке модального окна */
        CreateModalHeaderButtons(move: any) {
            let headerButtons = document.createElement('div');
            headerButtons.classList.add('dp-modal-action-blok');
            headerButtons.append(this.CreateModalFullButton(move), this.CreateButtonCloseModal());
            return headerButtons;
        }

        /** Создаем кнопку закрытия модального окна */
        CreateButtonCloseModal() {
            let button = document.createElement('button');
            button.classList.add('dp-modal-head-close');
            button.addEventListener('click', (e) => this.DestroyModalWindow(e));
            let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('dp-modal-head-icon');
            svg.insertAdjacentHTML('afterbegin', '<use xlink:href="/images/svg/dpicons.svg#close"></use>');
            button.append(svg);
            return button;
        }

        CreateModalFullButton(move: any) {
            let label = document.createElement('label');
            let span = document.createElement('span');
            let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            let svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            let input = document.createElement('input');
            svg.classList.add('dp-modal-head-icon');
            svg.classList.add('full-screen');
            svg2.classList.add('normal-screen');
            svg2.classList.add('dp-modal-head-icon');
            input.type = 'checkbox';

            label.classList.add('dp-modal-full');
            input.classList.add('dp-modal-screen-input');
            input.addEventListener('click', (e) => move.FullScreenChanged(e));
            span.classList.add('dp-modal-full-box');
            svg.insertAdjacentHTML('afterbegin', '<use xlink:href="/images/svg/dpicons.svg#fullscreen"></use>');
            svg2.insertAdjacentHTML('afterbegin', '<use xlink:href="/images/svg/dpicons.svg#normalscreen"></use>');
            span.append(svg);
            span.append(svg2);

            label.append(input);
            label.append(span);

            return label;
        }

        /** Создаем контент модального окна */
        CreateModalContent(content: HTMLElement) {
            let modalWindowContent = document.createElement('div');
            modalWindowContent.classList.add('dp-modal-blok-content');
            modalWindowContent.classList.add('active');
            modalWindowContent.style.overflow = 'auto';
            modalWindowContent.append(content);
            return modalWindowContent;
        }

        /** Создаем модальное окно */
        CreateModalWindow(content: HTMLElement) {
            let modalWindow = document.createElement('div');
            modalWindow.classList.add('dp-modal');
            modalWindow.style.animation = 'mmodalActive 0.3s linear forwards';
            modalWindow.dataset.action = content.dataset.action;
            modalWindow.dataset.tab = 'true';
            modalWindow.dataset.active = content.dataset.active;
            if (content.dataset.modal === 'true') {
                modalWindow.dataset.modal = 'true';
            }

            // let move = new Control.ResizeAndMoving({
            //     Blok: modalWindow,
            //     DeltaX: 70,
            //     DeltaY: 70,
            //     IsFull: false,
            //     resizible: true,
            //     Transformt: '',
            //     top: `25%`,
            //     left: `25%`,
            //     width: `50%`,
            //     height: `50%`,
            //     pinned: false,
            //     minHeight: 'none',
            //     minWidth: 'none',
            //     isFullScreen: false
            // });

            // modalWindow.append(this.CreateModalHeader(move), this.CreateModalContent(content));

            // for (let i = 0; i < this.modalWindowSides.length; i++) {
            //     modalWindow.append(this.CreateModalResizerElements(this.modalWindowSides[i], move));
            // }

            // document.body.append(modalWindow);
            this.Content!.append(modalWindow);
        }

        private _createModalWindows() {
            if (this.Content) {
                const contents = [...this.Content.children];
                if (contents?.length) {
                    for (let key of contents) {
                        const content = key as HTMLElement;
                        if (content?.dataset.modal === 'true' || this.el.modal) {
                            this.CreateModalWindow(content as HTMLElement);
                        }
                    }
                }
            }
        }

        /** Уничтожение модального окна */
        DestroyModalWindow(e: Event) {
            const target = e.target as HTMLElement;
            const modal = target.closest('.dp-modal') as HTMLElement;
            modal.dataset.tab = 'true';
            if (this.ActiveButton?.dataset.action === modal.dataset.action) {
                modal.dataset.active = 'true';
            } else {
                modal.dataset.active = 'false';
            }

            if (typeof this.el.onModal === 'function') {
                if (modal.dataset.action) {
                    this.el.onModal(modal.dataset.action);
                }
            }
        }

        /**
         * Показываем модальное окно
         * @param e - событие указателя
         */
        ShowModalWindow(e: Event) {
            const button = e.target as HTMLElement;
            const action = button.dataset.action;
            if (this.Content) {
                const modals = [...this.Content.children];
                if (modals) {
                    for (let key of modals) {
                        let modal = key as HTMLElement;
                        if (modal.dataset.action === action) {
                            if (modal.dataset.modal === 'true' || this.el.modal) {
                                modal.dataset.active = 'true';
                                modal.dataset.tab = 'false';

                                if (button.dataset.active === 'true') {
                                    this.ChangeMenuState();
                                }

                                if (typeof this.onModal === 'function') {
                                    this.onModal(action);
                                }
                                break;
                            } else {
                                break;
                            }

                        }
                    }
                }
            }
        }

        /**
         * Создаем элементы для изменения размера модального окна
         * @param side - сторона модального окна
         * @param move - Класс ResizeAndMoving
         */
        CreateModalResizerElements(side: string, move: any) {
            let resizerElement = document.createElement('span');
            resizerElement.classList.add('dp-modal-resize-' + side);

            const functionsNames = ['BeginTop', 'BeginBottom', 'BeginLeft', 'BeginRight', 'BeginTopLeft', 'BeginTopRight', 'BeginBottomLeft', 'BeginBottomRight'];

            for (let i = 0; i < this.modalWindowSides.length; i++) {
                switch (side) {
                    case this.modalWindowSides[i]:
                        // @ts-ignore
                        resizerElement.addEventListener('pointerdown', (e) => move[functionsNames[i]](e));
                        break;
                }
            }

            return resizerElement;
        }

        /** Получаем эелемент управлением размера контентной части */
        GetResizerBlock() {
            let block = document.createElement('div');
            let resize = document.createElement('div');
            let span = document.createElement('span');
            block.classList.add('dp-spliter');
            block.tabIndex = 15;
            resize.classList.add('dp-resize');
            span.classList.add('dp-resize-in');
            resize.addEventListener('pointerdown', (e) => this.BeginContentResize(e));
            resize.addEventListener('dblclick', () => this.ChangeMenuState());
            resize.append(span);
            block.append(resize);
            return block;
        }

        /** Выбираем вкладку */
        SelectTab(e: Event) {
            if (!this.el.disabled && this.state && !this.mainOnly) {
                const button = e.currentTarget as HTMLButtonElement;
                if (button.dataset.action) {
                    if (this.CheckEqualNames(button.dataset.action)) {
                        this.ActiveButton = button;
                        if (this.ActiveButton.classList.contains('dp-menu-toggle-check')) {
                            if (this.resizeComponent) {
                                if (this.ActiveButton.parentElement) {
                                    this.resizeComponent.ShowTabsInVisibilityArea(this.ActiveButton.parentElement);
                                }
                            }
                        }
                        if (this.ActiveButton) {
                            if (this.ActiveButton.dataset.action) {
                                this.tab = this.ActiveButton.dataset.action;
                            }
                        }
                    }
                }
            }
        }

        /** Открываем или закрываем контент при двойном клике на вкладку */
        SelectTabDblClick(e: Event) {
            const button = e.target as HTMLElement;
            if (button.dataset.action) {
                if (this.CheckEqualNames(button.dataset.action) && !this.state) {
                    this.ActiveButton = e.target as HTMLElement;
                    if (this.ActiveButton.dataset.action) {
                        this.tab = this.ActiveButton.dataset.action;
                    }
                    this.ChangeMenuState();
                } else {
                    if (this.contentWidth <= 1024) {
                        if (this.CheckEqualNames(button.dataset.action)) {
                            this.ChangeMenuState();
                        }
                    } else if (this.CheckEqualNames(button.dataset.action)) {
                        this.ChangeMenuState();
                    }
                }
            }
        }

        /**
         * Сравниваем имена кладок и модальных окон
         * @param action - название вкладки
         * @return boolean
         */
        CheckEqualNames(action: string) {
            if (!this.Content) return;
            if (!action) return;
            const modalWindows = this.Content!.querySelectorAll('.dp-modal');
            if (modalWindows?.length) {
                for (let key of modalWindows) {
                    let modal = key as HTMLElement;
                    if (modal.dataset.action === action) {
                        if (modal.dataset.tab === 'false') {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        /** Изменяем состояние меню */
        ChangeMenuState() {
            if (!this.el.disabled) {
                this.state = !this.state;
            }
        }

        ChangeActiveButton() {
            if (!this.ActiveButton || this.ActiveButton.classList.contains('dp-menu-toggle-check')) {
                this.ActiveButton = this.VerticalTab?.querySelector('[data-active="true"]') as HTMLElement;
            }

            if (this.ActiveButton) {
                if (this.ActiveButton.dataset.active === 'true' && this.state) {
                    this.ActiveButton.dataset.active = 'false';
                } else {
                    this.ActiveButton.dataset.active = 'true';
                }
            }
        }

        /**
         * Событие изменение размера
         * @param {Event} e - текущий размер окна
         */
        ResizeChanged(e: Event) {
            let target = e.target as unknown as Window;
            if (target.innerWidth <= 1024) {
                if (this.state) {
                    this.state = false;
                }
            }
            this.contentWidth = target.innerWidth;

            if (typeof this.onResize === 'function') {
                this.onResize(this);
            }
        }

        /**
         * Подписываемся на перемещение мышки
         * @param event - событие
         */
        BeginContentResize(event: MouseEvent | PointerEvent) {
            if (event.button === 0) {
                if (this.state) {
                    this.DeltaX = event.pageX - this.Resizer.clientWidth;
                    document.onpointermove = (e) => this.MoveContent(e);
                    document.addEventListener('pointerup', () => {
                        document.onpointermove = null;
                    });
                }
            }
        }

        /**
         * Перемещение
         * @param event - Событие
         */
        MoveContent(event: MouseEvent | PointerEvent) {
            if (this.contentWidth - event.pageX <= 220) {
                if (this.state) {
                    this.ChangeMenuState();
                }
            } else {
                if (this.Content) {
                    this.Content.style.width = `${this.contentWidth - event.pageX - 40}px`;
                }

            }
        }

        DisabledTab(action: string, result: boolean): void {
            super.GeneralDisabledTab(this.tabButtons, action, result);
        }

        // #region Свойства
        get main() {
            return this.el.main;
        }

        set main(value) {
            if (value) {
                this.el._main = value;
            }
        }

        get tab() {
            return this.el.tab;
        }

        set tab(value: string) {
            super.SetActiveTab(value, this.tabButtons).then((res) => {
                if (typeof res === 'boolean') {
                    const result = res as unknown as boolean;
                    if (!result) {
                        this.state = false;
                    }
                }
            }).catch(() => {
                this.state = false;
            });
        }

        get state() {
            return this.el.state;
        }

        set state(value: boolean) {
            if (typeof value === 'boolean') {
                if (this.Content) {
                    if (value) {
                        if (this.ActiveButton) {
                            if (!this.CheckEqualNames(this.ActiveButton.dataset.action!)) {
                                return;
                            }
                        }
                    }
                    this.ChangeActiveButton();
                    this.el._state = value;
                    this.Content.dataset.active = `${value}`;
                    if (typeof this.onState === 'function') {
                        this.onState(value);
                    }
                }
            } else {
                throw new Error('не верный тип данных: state - boolean');
            }
        }

        get disabled() {
            return this.el.disabled;
        }

        set disabled(value: boolean) {
            if (typeof value === 'boolean') {
                if (!value) {
                    if (this.ActiveButton) {
                        this.el._disabled = value;
                        this.ActiveButton.dataset.active = 'true';
                    }
                }
                this.state = !value;
                super.SetDisabledTabs(this.tabButtons, value);
            } else {
                throw new Error('не верный тип данных: disabled - boolean');
            }
        }

        get mainOnly() {
            return this.el.mainOnly;
        }

        set mainOnly(value: boolean) {
            if (typeof value === 'boolean') {
                this.el._mainOnly = value;
                if (this.el.main) {
                    if (this.tabButtons) {
                        for (let button of this.tabButtons) {
                            if (button.dataset.action === this.el.main) {
                                this.ActiveButton = button;
                                break;
                            }
                        }
                        super.SetMainOnly(value, this.tabButtons);
                    }
                } else {
                    throw new Error('свойство main не присвоено');
                }
            } else {
                throw new Error('не верный тип данных: mainonly - boolean');
            }
        }
    }

    export class TabTop extends TabGeneralMethods {
        el: any;
        tabButtons: NodeListOf<HTMLElement> | undefined;
        elementsWidth: Array<number>;

        TabList: HTMLElement | null;
        Content: HTMLElement | undefined;
        ActiveButton: HTMLElement | undefined;
        resizeComponent: DPElements.TabResize | undefined;

        constructor(el: any) {
            super(el);
            this.el = el;
            this.elementsWidth = [];
            this.TabList = null;
            this.Initialize();

        }

        Initialize() {
            if (this.el) {
                this.el.classList.remove('dp-vertical-tabs-block');
                this.el.classList.add('dp-top-tabs-block');
                this.tabButtons = this.el.querySelectorAll('.dp-tabs-button');
                this.TabList = this.el.querySelector('.dp-tabs-list');
                if (this.TabList) {
                    this.resizeComponent = new DPElements.TabResize(this.TabList, false, 'top');
                }
                if (this.resizeComponent) {
                    super.Menu = this.resizeComponent.contextMenu;
                    this.AddListenerForMenuTabs();
                    this.InitMethodsForContentHandler();
                    super.ContentHandler(this.tabButtons, 'top');
                    this.resizeComponent.WatchWidthChange(this.elementsWidth);
                    super.classNameContent = 'dp-top-tab-contents';
                }
            }
        }

        /** Инициализируем функции предназначенные для вызова в TabGeneralMethods.ContentHandler */
        InitMethodsForContentHandler() {
            /** Задается обработчики кнопкам и  */
            super.addListenersAndShowTabs = (btn: HTMLElement) => {
                if (this.resizeComponent && btn.parentElement) {
                    btn.addEventListener('click', (e) => this.ToolBarTabSelect(e));
                    this.resizeComponent.ShowTabsInContextMenu(btn.parentElement, this.elementsWidth);
                }
            };
            /** Изменяется видимость вкладок при изменении типа кнопки, иконка или имя. */
            super.changeVisible = () => {
                if (this.resizeComponent) {
                    this.resizeComponent.WatchWidthChange(this.elementsWidth);
                    this.resizeComponent.ChangeVisibleItems(this.elementsWidth);
                }
            };
            /** Устанавливаются размеры вкладок */
            super.setSize = (btn: HTMLElement) => {
                if (btn.parentElement) {
                    this.elementsWidth.push(btn.parentElement.offsetWidth);
                }
            };
            /** устанавливается контент */
            super.setContent = (content: HTMLElement) => this.Content = content;
            /** устанавливается активная вкладка */
            super.setTab = (action: string) => this.tab = action;
            /** Обновляем размер вкладок при изменении типа кнопок */
            super.updateSize = (updDate: Array<number>) => this.elementsWidth = updDate;
        }

        /** Добавляем слушатель событий на вкладки контексного меню */
        AddListenerForMenuTabs() {
            if (this.resizeComponent) {
                for (let i = 0; i < this.resizeComponent.menuTabs.length; i++) {
                    let item = this.resizeComponent.menuTabs[i];
                    let button = item.querySelector('.dp-menu-toggle-check') as HTMLElement;
                    button.addEventListener('click', (e) => this.ToolBarTabSelect(e));
                }
            }
        }

        /**
         * Выбор вкладки
         * @param {any} event
         */
        ToolBarTabSelect(event: Event) {
            let button = event.currentTarget as HTMLElement;
            if (button) {
                if (button.dataset.action) {
                    this.ActiveButton = button.parentElement!;
                    super.SetActiveTab(button.dataset.action, this.tabButtons).then((res) => {
                        if (res) {
                            if (button.parentElement && this.resizeComponent) {
                                if (button.parentElement.classList.contains('dp-menu-list-item')) {
                                    this.resizeComponent.ShowTabsInVisibilityArea(button.parentElement);
                                }
                            }
                        }
                    });
                }
            }
        }

        DisabledTab(action: string, result: boolean) {
            return super.GeneralDisabledTab(this.tabButtons, action, result);
        }

        get main() {
            return this.el._main;
        }

        set main(value) {
            if (value) {
                this.el._main = value;
            }
        }

        get tab() {
            return this.el._tab;
        }

        set tab(value: string) {
            super.SetActiveTab(value, this.tabButtons);
        }

        get state() {
            return this.el.state;
        }

        set state(value: boolean) {
            if (typeof value === 'boolean') {
                this.el._state = value;
            } else {
                throw new Error('не верный тип данных: state - boolean');
            }
        }

        get disabled() {
            return this.el._disabled;
        }

        set disabled(value: boolean) {
            if (typeof value === 'boolean') {
                if (!value && this.ActiveButton) {
                    this.ActiveButton.dataset.active = 'true';
                }
                this.el._disabled = value;
                super.SetDisabledTabs(this.tabButtons, value);
            } else {
                throw new Error('не верный тип данных: disabled - boolean');
            }
        }

        get mainOnly() {
            return this.el._mainOnly;
        }

        set mainOnly(value: boolean) {
            if (typeof value === 'boolean') {
                this.el._mainOnly = value;
                if (this.el._main) {
                    const mainButton = this.el.querySelector(`[data-action=${this.el.main}]`);
                    if (mainButton?.parentElement) this.ActiveButton = mainButton.parentElement;
                    super.SetMainOnly(value, this.tabButtons);
                } else {
                    throw new Error('свойство main не присвоено');
                }
            } else {
                throw new Error('не верный тип данных: mainonly - boolean');
            }
        }
    }

    export class TabRight extends GeneralVerticalTab {
        constructor(el: any) {
            super(el);
            if (this.el) {
                this.el.prepend(this.Resizer);
            }
        }
    }

    export class TabLeft extends GeneralVerticalTab {
        /**
         * Перемещение
         * @param event - Событие
         */
        MoveContent(event: MouseEvent | PointerEvent) {
            if (event.pageX <= 220) {
                if (this.state) {
                    this.ChangeMenuState();
                }
            } else {
                if (this.Content) {
                    this.Content.style.width = `${event.pageX - 40}px`;
                }
            }
        }
    }

    export class TabBottom extends TabGeneralMethods {
        el: any;
        onRemove: Function | undefined;
        onCreate: Function | undefined;
        isRender: boolean;

        removeButtons: NodeListOf<HTMLElement> | undefined;
        tabButtons: Array<HTMLElement>;
        elementsWidth: Array<number>;
        isDataAdd: boolean;
        isDataRemove: boolean;

        Content: HTMLElement | undefined;
        AddButton: HTMLElement | null;
        BottomTab: HTMLElement | null;
        NoLayoutText: HTMLElement | undefined;
        generalMethods: DPElements.TabGeneralMethods;
        resizeComponent: DPElements.TabResize | undefined;

        constructor(el: any) {
            super(el);
            this.el = el;
            this.isRender = false;
            this.AddButton = null;
            this.BottomTab = null;
            this.elementsWidth = [];
            this.tabButtons = [];
            this.isDataAdd = true;
            this.isDataRemove = true;
            this.generalMethods = new DPElements.TabGeneralMethods(this.el);
            this.InitMethodsForContentHandler();
            this.Initialize();
        }

        /** Инициализация компоненты */
        Initialize() {
            if (!this.isRender) {
                if (this.dataSource?.data?.list?.length) {
                    this.CreateAndProcessTabs();
                    this.SubscribeToMethods();
                } else if (this.el && this.el.querySelector('.dp-bottom-tab-button')) {
                    this.el.classList.remove('dp-vertical-tabs-block');
                    this.el.classList.add('dp-bottom-tabs-block');
                    this.AddButton = this.el.querySelector('.dp-bottom-tab-button-add');
                    if (this.AddButton) {
                        this.AddButton.addEventListener('click', () => this.AddTab(false));
                    }
                    this.removeButtons = this.el.querySelectorAll('.dp-bottom-tab-cross-button');
                    if (this.removeButtons) {
                        for (let btn of this.removeButtons) {
                            btn.addEventListener('click', (e) => this.RemoveTab(e));
                        }
                    }
                    this.BottomTab = this.el.querySelector('.dp-bottom-tab');
                    if (this.BottomTab) {
                        this.resizeComponent = new DPElements.TabResize(this.BottomTab, false, 'bottom');
                    }
                    if (this.resizeComponent) {
                        this.resizeComponent.position = 'bottom';
                        this.AddListenerForMenuTabs();
                        this.GetTabButtons();
                        super.Menu = this.resizeComponent.contextMenu;
                        super.ContentHandler(this.tabButtons, 'bottom');
                        this.resizeComponent.WatchWidthChange(this.elementsWidth);
                    }
                } else {
                    this.dataSource = new DPDataSource({
                        list: []
                    });
                    this.CreateBasicTab();
                }
                this.isRender = true;
            }
        }

        GetTabButtons() {
            this.tabButtons = [];
            const buttons = this.el?.querySelectorAll('.dp-bottom-tab-button');
            if (buttons) {
                for (let button of buttons) {
                    let btn = button as HTMLElement;
                    this.tabButtons.push(btn);
                }
            }
        }

        /** Инициализируем функции предназначенные для вызова в TabGeneralMethods.ContentHandler */
        InitMethodsForContentHandler() {
            /**
             * @param {HTMLElement} btn - кнопка вкладки
             * @param {boolean} sub - нужна запускать метод для подписки на методы с dataSource или нет
             */
            super.addListenersAndShowTabs = (btn: HTMLElement, sub: boolean) => {
                if (!sub) {
                    this.AddListenerToTabButton(btn);
                    if (this.resizeComponent && btn.parentElement) {
                        this.resizeComponent.ShowTabsInContextMenu(btn.parentElement, this.elementsWidth);
                    }
                } else {
                    this.SubscribeToMethods();
                }
            };
            /** @param {HTMLElement} btn - кнопка вкладки */
            super.setSize = (btn: HTMLElement) => {
                if (btn.parentElement) {
                    this.elementsWidth.push(btn.parentElement.offsetWidth);
                }
            };
            /** @param {HTMLElement} content - контент вкладки */
            super.setContent = (content: HTMLElement) => this.Content = content;
            /** @param {string} action - action вкладки */
            super.setTab = (action: string) => this.tab = action;
        }

        /**
         * Обновление списка при поступлении новых данных
         * @param {DPDataSource} data - база данных
         */
        SetData(data: DPDataSource) {
            this.el._dataSource = data;
            this.SubscribeToMethods();
            if (this.dataSource?.data?.list?.length) {
                this.CreateAndProcessTabs();
            } else if (this.dataSource?.data?.transport) {
                if (this.dataSource.data.transport.read) {
                    this.dataSource.data.transport.read((e: any) => {
                        this.CreateAndProcessTabs();
                    });
                }
            }
        }

        /** Добавляем слушатель событий на вкладки контексного меню */
        AddListenerForMenuTabs() {
            if (this.resizeComponent) {
                for (let i = 0; i < this.resizeComponent.menuTabs.length; i++) {
                    let item = this.resizeComponent.menuTabs[i];
                    let buttonCross = item.querySelector('.dp-bottom-tab-cross-button') as HTMLElement;
                    buttonCross.addEventListener('click', (e) => this.RemoveTab(e));
                    let button = item.querySelector('.dp-menu-toggle-check') as HTMLElement;
                    this.AddListenerToTabButton(button);
                }
            }
        }

        /**
         * Добавляем события на кнопку
         * @param btn - кнопка вкладки
         */
        AddListenerToTabButton(btn: HTMLElement) {
            btn.addEventListener('click', (e) => {
                const button = e.target as HTMLElement;
                if (!button.classList.contains('dp-bottom-tab-cross-button')) {
                    this.SelectTab(e);
                }
            });
        }

        /** Поиск контента вкладки */
        SearchTabContent(action: string) {
            const parentsContent = this.Content?.querySelectorAll('.dp-tab-content');
            if (parentsContent) {
                for (let key of parentsContent) {
                    let parentContent = key as HTMLElement;
                    if (parentContent.dataset.action === action) {
                        return parentContent;
                    }
                }
            }
        }

        /**
         * Удаление вкладки при нажатии на крестик
         * @param e - событие или модель с datasource
         */
        RemoveTab(e: Event) {
            let action: string | undefined;
            this.isDataRemove = false;
            let buttonRemove = e.target as HTMLElement;
            let parent = buttonRemove?.parentElement?.parentElement;
            const button = parent?.querySelector('.dp-bottom-tab-button') as HTMLElement ||
                parent?.querySelector('.dp-menu-toggle-check');
            if (button) {
                if (button.dataset.action) action = button.dataset.action;
            }
            for (let data of this.dataSource.data.list) {
                if (data.uid === button.dataset.uid) {
                    this.dataSource.Remove(data[this.dataSource.idParam]);
                }
            }
            if (parent && action) {
                this.RemoveElementsTab(action, parent);
            }
            this.isDataRemove = true;
        }

        /**
         * Удаляем вкладку при вызове Remove из DPDataSource
         * @param model - модель вкладки
         */
        RemoveFromData(model: any) {
            let parent: HTMLElement | undefined;
            let action: string | undefined;
            const buttons = this.el?.querySelectorAll('.dp-bottom-tab-button');
            if (buttons) {
                for (let key of buttons) {
                    const btn = key as HTMLElement;
                    if (btn.dataset.uid === model.uid) {
                        action = btn.dataset.action;
                        parent = btn.parentElement as HTMLElement;
                    }
                }
            }

            if (action && parent) {
                this.RemoveElementsTab(action, parent);
            }
        }

        /**
         * Удаляем родителя, элементы и контент вкладки
         * @param action - action кнопки
         * @param parent - родитель кнопки
         */
        RemoveElementsTab(action: string, parent: HTMLElement) {
            for (let i = 0; i < this.elementsWidth.length; i++) {
                if (this.elementsWidth[i] === parent.offsetWidth) {
                    this.elementsWidth.splice(i, 1);
                    break;
                }
            }
            this.SearchTabContent(action)!.remove();
            this.RemoveItemsInResizeComponent(action);
            parent?.remove();

            if (this.resizeComponent) {
                if (this.resizeComponent.CheckVisibleItemsInMenu()) {
                    this.resizeComponent.RemoveContextMenuButton();
                }
                this.resizeComponent.WatchWidthChange(this.elementsWidth);
                this.resizeComponent.ChangeVisibleItems(this.elementsWidth);
            }

            if (this.tabButtons.length) {
                this.tabButtons = this.tabButtons.filter(btn => btn.dataset.action !== action);
                if (this.tabButtons.length) {
                    if (this.tab === action) {
                        const dataAction = this.tabButtons[this.tabButtons.length - 1].dataset.action;
                        if (dataAction) this.tab = dataAction;
                    }
                }
            }

            this.CheckContent();

            this.tabProperties = this.tabProperties.filter(model => model.action !== action);

            if (typeof this.onRemove === 'function') {
                this.onRemove(action);
            }
        }

        /** Удаление элементов из массивов в компоненте resizeComponent
         * @param action - параметр dataset кнопки
         */
        RemoveItemsInResizeComponent(action: string) {
            let items;
            if (this.resizeComponent) {
                for (let i = 0; i < 2; i++) {
                    i === 0 ? items = this.resizeComponent.tabBarTabs : items = this.resizeComponent.menuTabs;
                    if (items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const itemChild = items[i]?.querySelector('.dp-bottom-tab-button') as HTMLElement ||
                                items[i]?.querySelector('.dp-menu-toggle-check') as HTMLElement;
                            if (itemChild) {
                                if (itemChild.dataset.action) {
                                    if (itemChild?.dataset.action === action) {
                                        items.splice(i, 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        /** Создаем контейнер вкладки */
        CreateTabItem() {
            let tabItem = document.createElement('li');
            tabItem.classList.add('dp-bottom-tab-item');

            return tabItem;
        }

        /** Создаем кнопку вкладки */
        CreateTabButton() {
            let button = document.createElement('button');
            button.classList.add('dp-bottom-tab-button');

            return button;
        }

        /** Создаем кнопку удалить для вкладки */
        CreateTabRemoveButton() {
            let buttonCross = document.createElement('span');
            buttonCross.classList.add('dp-bottom-tab-cross-button');
            buttonCross.addEventListener('click', (e) => this.RemoveTab(e));

            return buttonCross;
        }

        /** Создаем текстовое содержимое вкладки */
        CreateTabText() {
            let text = document.createElement('span');
            text.classList.add('dp-bottom-tab-button-text');

            return text;
        }

        /** Создаем контейнер для контента, привязанный к созданной вкладке */
        CreateTabContent() {
            let content = document.createElement('div');
            content.classList.add('dp-tab-content');

            return content;
        }

        /** Создаем кнопку добавить */
        CreateAddButton() {
            let addTab = document.createElement('li');
            addTab.classList.add('dp-bottom-tab-add');

            let addTabBtn = document.createElement('button');
            addTabBtn.classList.add('dp-bottom-tab-button-add');
            addTabBtn.addEventListener('click', () => this.AddTab(false));
            addTab.append(addTabBtn);
            return addTab;
        }

        /** Создаем базовую структуру без вкладок */
        CreateBasicTab() {
            if (this.el) {
                this.el.classList.remove('dp-vertical-tabs-block');
                this.el.classList.add('dp-bottom-tabs-block');
                let bottomTab = document.createElement('ul');
                bottomTab.classList.add('dp-bottom-tab');
                let contentBlock = document.createElement('div');
                contentBlock.classList.add('dp-bottom-tab-contents');

                this.BottomTab = bottomTab;
                this.Content = contentBlock;

                this.Content.append(this.CreateNoLayoutText());

                let addTab = this.CreateAddButton();
                bottomTab.append(addTab);

                this.el.append(contentBlock, bottomTab);

                this.resizeComponent = new DPElements.TabResize(this.BottomTab, false, 'bottom');
                super.Menu = this.resizeComponent.contextMenu;
                super.classNameContent = 'dp-bottom-tab-contents';
            }
        }

        CreateNoLayoutText() {
            this.NoLayoutText = document.createElement('p');
            this.NoLayoutText.classList.add('dp-tab-contents-no-layout');
            this.NoLayoutText.innerText = this.el.noLayout;
            return this.NoLayoutText;
        }

        /** Создаем и обрабатываем вкладки */
        CreateAndProcessTabs() {
            if (this.Content && this.BottomTab) {
                this.Content.innerHTML = '';
                this.BottomTab.innerHTML = '';
                let addTab = this.CreateAddButton();
                this.BottomTab.append(addTab);
            }
            if (!this.Content) this.CreateBasicTab();
            this.CreateTabs();

            if (!this.resizeComponent) {
                if (this.BottomTab) {
                    this.resizeComponent = new DPElements.TabResize(this.BottomTab, false, 'bottom');
                    this.resizeComponent.position = 'bottom';
                }
            } else {
                this.resizeComponent.UpdateData();
            }

            if (this.resizeComponent) {
                this.AddListenerForMenuTabs();
                this.InitMethodsForContentHandler();
                this.GetTabButtons();
                super.Menu = this.resizeComponent.contextMenu;
                this.elementsWidth = [];
                super.ContentHandler(this.tabButtons, 'bottom');
                this.resizeComponent.WatchWidthChange(this.elementsWidth);
                this.CheckContent();
            }
        }

        CheckContent() {
            const content = this.Content?.querySelector('.dp-tab-content');
            if (content && this.NoLayoutText) {
                this.NoLayoutText.remove();
                this.NoLayoutText = undefined;
            } else if (!content) {
                if (!this.NoLayoutText) this.Content?.append(this.CreateNoLayoutText());
            }
        }

        /** Создаем вкладки */
        CreateTabs() {
            for (let btn of this.dataSource.data.list) {
                const item = this.CreateTabItem();

                let button = this.CreateTabButton();
                let content = this.CreateTabContent();

                if (btn[this.dataActionField]) {
                    button.dataset.action = btn[this.dataActionField];
                    content.dataset.action = btn[this.dataActionField];
                } else {
                    button.dataset.action = btn.uid;
                    content.dataset.action = btn.uid;
                }

                button.dataset.uid = btn.uid;

                const buttonCross = this.CreateTabRemoveButton();

                this.Content?.append(content);

                let text = this.CreateTabText();
                text.textContent = btn[this.dataTextField];

                button.append(text, buttonCross);
                item.append(button);
                this.BottomTab?.append(item);
            }
        }

        /** Подписываемся на методы из DPDataSource */
        SubscribeToMethods() {
            this.dataSource.onAdd = (model: any) => {
                if (this.isDataAdd) {
                    this.AddTab(model);
                }
            };
            this.dataSource.onRemove = (model: any) => {
                if (this.isDataRemove) {
                    this.RemoveFromData(model);
                }
            };
            this.dataSource.onEdit = (model: any) => this.EditTab(model);
        }

        /**
         * Редактируем вкладку
         * @param model - модель измененного элемента
         */
        EditTab(model: any) {
            for (let data of this.dataSource.data.list) {
                if (data[this.dataSource.idParam] === model[this.dataSource.idParam]) {
                    const buttons = this.el?.querySelectorAll('.dp-bottom-tab-button');
                    if (buttons) {
                        for (let key of buttons) {
                            let button = key as HTMLElement;
                            if (button.dataset.uid === data.uid) {
                                const text = button.querySelector('.dp-bottom-tab-button-text') as HTMLElement;
                                if (text) text.innerText = data[this.dataTextField];
                            }
                        }
                    }
                }
            }
        }

        /**
         * Выбираем вкладку
         * @param e - событие указателя
         */
        SelectTab(e: Event) {
            let button = e.currentTarget as HTMLButtonElement;
            if (button?.parentElement?.classList.contains('dp-menu-list-item')) {
                if (this.resizeComponent) {
                    this.resizeComponent.ShowTabsInVisibilityArea(button.parentElement);
                }
            }
            if (button) {
                if (button.dataset.action) {
                    this.tab = button.dataset.action;
                }
            }
        }

        /** Проверка на одинаковые имена вкладок */
        CheckEqualNames() {
            let num = 1;
            if (this.dataSource?.data?.list?.length) {
                for (let list of this.dataSource.data.list) {
                    if (list[this.dataTextField].indexOf(`${this.el.defaultName}`) !== -1) {
                        num += 1;
                    }
                }
            }
            for (let i = 0; i < this.tabButtons.length; i++) {
                let btn = this.tabButtons[i] as HTMLElement;
                if (btn.dataset.number) {
                    if (num === +btn.dataset.number && num !== 1) {
                        num--;
                        i = -1;
                    }
                }
            }

            return num;
        }

        /** Задаем data-active="false" для всех кнопок, кроме вновь созданной */
        DisableButtonActive() {
            if (this.tabButtons.length) {
                for (let key of this.tabButtons) {
                    let btn = key as HTMLElement;
                    if (btn.dataset.active === 'true') {
                        btn.dataset.active = 'false';
                    }
                }
                this.tabProperties.map(item => item.active = false);
            }
        }

        /** Добавляем вкладку */
        AddTab(model: any) {
            this.isDataAdd = false;
            const numberName = this.CheckEqualNames();

            this.DisableButtonActive();

            const tabItem = this.CreateTabItem();
            tabItem.dataset.visible = 'true';

            const button = this.CreateTabButton();
            button.dataset.active = 'true';
            this.AddListenerToTabButton(button);

            const buttonCross = this.CreateTabRemoveButton();

            const text = this.CreateTabText();
            if (model) {
                if (model[this.dataTextField]) {
                    text.innerText = model[this.dataTextField];
                } else {
                    throw new Error('Отстутствует свойство dataTextField');
                }
            } else {
                text.innerText = `${this.el.defaultName} ${numberName}`;
                button.dataset.number = `${numberName}`;
            }

            const content = this.CreateTabContent();

            button.append(text, buttonCross);
            tabItem.append(button);

            this.Content?.append(content);
            if (!model) {
                let data = {
                    [this.dataIdField]: DPElements.Global.NewGuid(),
                    [this.dataTextField]: text.innerText,
                    disabled: false
                };
                this.dataSource?.Add(data);
            }
            this.isDataAdd = true;

            if (model) {
                if (model[this.dataActionField]) {
                    button.dataset.action = model[this.dataActionField];
                    content.dataset.action = model[this.dataActionField];
                } else {
                    button.dataset.action = model.uid;
                    content.dataset.action = model.uid;
                }
                button.dataset.uid = model.uid;
            } else {
                const dataItem = this.dataSource.data.list[this.dataSource.data.list.length - 1];
                button.dataset.action = dataItem.uid;
                button.dataset.uid = button.dataset.action;
                content.dataset.action = button.dataset.action;
                dataItem[this.dataActionField] = button.dataset.action;
            }

            tabItem.dataset.uid = DPElements.Global.NewGuid();

            if (this.resizeComponent) {
                if (this.resizeComponent.ContextMenuBtn) {
                    this.resizeComponent.ContextMenuBtn.before(tabItem);
                } else {
                    this.BottomTab?.append(tabItem);
                }
            }


            this.DistributionItems(tabItem);
            this.tabButtons.push(button);
            if (button.dataset.action) {
                this.CheckContent();
                this.tab = button.dataset.action;
            }
            if (typeof this.onCreate === 'function') {
                this.onCreate(button.dataset.action);
            }
        }

        /** Распределяем вкладки по массивам вкладок и контекстного меню */
        DistributionItems(item: HTMLElement) {
            if (this.resizeComponent) {
                this.resizeComponent.tabBarTabs.push(item);

                let cloneItemInMenu = item.cloneNode(true);
                let cloneMenuItem = cloneItemInMenu as HTMLElement;

                if (cloneMenuItem) {
                    cloneMenuItem.dataset.visible = 'false';
                    cloneMenuItem.classList.remove('dp-bottom-tab-item');
                    cloneMenuItem.classList.add('dp-menu-list-item');
                }

                this.elementsWidth.push(item.offsetWidth);

                let menuItemChild = cloneMenuItem.querySelector('.dp-bottom-tab-button') as HTMLElement;
                if (menuItemChild) {
                    menuItemChild.classList.remove('dp-bottom-tab-button');
                    menuItemChild.classList.add('dp-menu-toggle-check');
                    menuItemChild.dataset.active = 'false';
                    menuItemChild.addEventListener('click', (e) => this.SelectTab(e));
                }

                let menuItemCross = cloneMenuItem.querySelector('.dp-bottom-tab-cross-button');
                menuItemCross?.addEventListener('click', (e) => this.RemoveTab(e));

                this.resizeComponent.ContextList?.append(cloneMenuItem);
                this.resizeComponent.menuTabs.push(cloneMenuItem);
                this.resizeComponent.WatchWidthChange(this.elementsWidth);

                this.resizeComponent.ShowTabsInContextMenu(item, this.elementsWidth);
            }
        }

        DisabledTab(action: string, result: boolean) {
            return super.GeneralDisabledTab(this.tabButtons, action, result);
        }

        Add(model: any, el: string | HTMLElement) {
            this.dataSource.Add(model);
            const container = this.el.GetContent(model[this.dataIdField]);
            if (container) {
                const element = this._getElement(el);
                if (typeof element === 'string') {
                    container.insertAdjacentHTML('afterbegin', element);
                } else if (typeof element === 'object' && element instanceof HTMLElement) {
                    if (element.tagName === 'TEMPLATE') {
                        let temp = element as HTMLTemplateElement;
                        let clone = temp.content.cloneNode(true);
                        container.append(clone);
                    } else {
                        container.append(element);
                    }
                }
            }
        }

        /**
         * Проверяем существование элемента в DOM
         * @param {any} element - Строка с id, class или HTMLElement
         */
        private _getElement(element: string | HTMLElement) {
            let result: any;
            let el: string;
            if (typeof element === 'string') {
                result = element;
                let first = element[0];
                switch (first) {
                    case '#':
                        el = element.slice(1);
                        result = document.getElementById(el);
                        break;
                    case '.':
                        result = document.querySelector(element);
                        break;
                    default:
                        break;
                }
            } else if (typeof element === 'object' && element instanceof HTMLElement) {
                result = element;
            }
            return result;
        }

        // #region set and get

        get tabProperties() {
            return this.el.tabProperties;
        }

        set tabProperties(properties: Array<TabProperties>) {
            this.el._tabProperties = properties;
        }

        get dataSource() {
            return this.el.dataSource;
        }

        set dataSource(value: DPDataSource) {
            this.SetData(value);
        }

        get dataActionField() {
            return this.el.dataActionField;
        }

        get dataTextField() {
            return this.el.dataTextField;
        }

        get dataIdField() {
            return this.el.dataIdField;
        }

        get main() {
            return this.el.main;
        }

        set main(value) {
            if (value) {
                this.el._main = value;
            }
        }

        get tab() {
            return this.el.tab;
        }

        set tab(value: string) {
            super.SetActiveTab(value, this.tabButtons);
        }

        get state() {
            return this.el.state;
        }

        set state(value: boolean) {
            if (typeof value === 'boolean') {
                this.el._state = value;
            } else {
                throw new Error('не верный тип данных: state - boolean');
            }
        }

        get disabled() {
            return this.el.disabled;
        }

        set disabled(value: boolean) {
            if (typeof value === 'boolean') {
                this.el._disabled = value;
                super.SetDisabledTabs(this.tabButtons, value);
            } else {
                throw new Error('не верный тип данных: disabled - boolean');
            }
        }

        get mainOnly() {
            return this.el.mainOnly;
        }

        set mainOnly(value: boolean) {
            if (typeof value === 'boolean') {
                this.el._mainOnly = value;
                if (this.el.main) {
                    super.SetMainOnly(value, this.tabButtons);
                } else {
                    throw new Error('свойство main не присвоено');
                }
            } else {
                throw new Error('не верный тип данных: mainonly - boolean');
            }
        }

        get defaultName() {
            return this.el.defaultName;
        }

        // #endregion
    }
}

customElements.define('dataplat-switch', class DataPlatToogleSwitch extends HTMLElement {
    private _text: string;
    private _second: string;
    private _value: boolean;
    private _disabled: boolean;
    private _title: string;
    _input: HTMLInputElement | undefined;
    isRender: boolean;

    constructor() {
        super();
        this._text = '';
        this._second = '';
        this._title = '';
        this._disabled = false;
        this._value = false;
        this.isRender = false;
    }

    connectedCallback() {
        if (!this.isRender) {
            this.append(this._getTemplate());
            this.isRender = true;
        }
    }
    disconnectedCallback() {
        try {
            this._input?.remove();
            this?.remove();

        } catch (ex) {
            console.log(ex);
        }

    }
    /** Коллекция свойств */
    static get observedAttributes() {
        return ['text', 'value', 'second', 'title', 'disabled'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }
    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'text': this._setText(newValue); break;
            case 'value': this._setValue(newValue); break;
            case 'title': this._setTitle(newValue, oldValue); break;
            case 'second': this._setSecond(newValue); break;
            case 'disabled': this._setDisabled(newValue); break;
        }
    }

    _getTemplate() {
        let label = document.createElement('label');

        let slider = document.createElement('span');
        slider.classList.add('dp-switch-slider');
        label.classList.add('dp-switch');
        DPElements.Global.CheckProperty(this, 'value');

        label.append(this.GetInput());
        DPElements.Global.CheckProperty(this, 'text');

        DPElements.Global.CheckProperty(this, 'second');

        DPElements.Global.CheckProperty(this, 'disabled');

        DPElements.Global.CheckProperty(this, 'title');
        label.append(slider);
        label.append(this._getTextElement());
        return label;
    }

    /** Получаем чекбокс */
    GetInput() {
        this._input = document.createElement('input');
        this._input.classList.add('dp-switch-input');
        this._input.checked = this.value;
        this._input.type = 'checkbox';
        this._input.disabled = this.disabled;
        this._input.addEventListener('click', (e) => this._checkChanged(e));

        return this._input;
    }

    _getTextElement() {
        let span = document.createElement('span');
        span.classList.add('dp-switch-name');
        if (this.second.length > 0) {
            if (this.value === true) {
                span.innerText = this.second;
            } else {
                span.innerText = this.text;
            }
        } else {
            span.innerText = this.text;
        }

        return span;
    }

    _checkChanged(event: Event) {
        let target = event.target as HTMLInputElement;
        if (target) {
            this.value = target.checked;
        }
        let eventNew = new Event("changed", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
    }
    /** Переключаем активность элементап */
    _setDisabled(value: boolean) {
        if (typeof value === 'boolean') {
            if (this._input) {
                this._disabled = value;
                this._input.disabled = value;
            }
        } else {
            if (typeof value === 'string') {
                if (value === 'true') {
                    this._disabled = true;
                } else {
                    this._disabled = false;
                }
                if (this._input) {

                    this._input.disabled = this._disabled;
                }
            }
        }
    }
    /**
     * Задаем значение титла
     * @param newValue - Новое значение
     * @param oldValue - Старое значение
     */
    _setTitle(newValue: string, oldValue: string) {
        if (typeof newValue === 'string') {
            if (newValue !== oldValue) {
                this._title = newValue;
                this.setAttribute('title', newValue);
            }
        }

    }

    /** Задаем значние элементу */
    _setValue(value: boolean) {
        if (typeof value === 'boolean') {
            this._value = value;
        } else {
            if (value === 'true') {
                this._value = true;
            }
            if (value === 'false') {
                this._value = false;
            }
        }
        if (this._input) {
            this._input.checked = this._value;
        }
        if (this.second.length > 0) {
            let element = this.querySelector('.dp-switch-name') as HTMLElement;
            if (element) {
                if (this.value === true) {
                    element.innerText = this.second;
                } else {
                    element.innerText = this.text;
                }
            }

        }
    }
    /** Задаем значение второму названию */
    _setSecond(value: string) {
        let element = this.querySelector('.dp-switch-name') as HTMLElement;
        if (value) {
            if (value === null) value = '';
            if (value !== this._second) {
                this._second = value;
                if (element) {
                    if (this.value === true) {
                        element.innerText = value;

                    }
                }
            }
        } else {
            this._second = '';
            if (element) {
                element.innerText = this.text;
            }
        }
    }
    /** Задаем название текста  */
    _setText(value: string) {
        let element = this.querySelector('.dp-switch-name') as HTMLElement;
        if (value) {
            if (value === null) value = '';
            if (value !== this._text) {
                this._text = value;

                if (element) {
                    if (this.second.length > 0) {
                        if (this.value === false) {
                            element.innerText = value;
                        }
                    } else {
                        element.innerText = value;

                    }
                }

            }

        } else {
            this._text = '';
            if (element) {
                element.innerText = this._text;
            }
        }
    }
    get title(): string {
        return this._title;
    }
    set title(value: string) {
        this._setProperty('title', value);
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', value);
    }

    get value(): boolean {
        return this._value;
    }

    set value(value: boolean) {
        this._setProperty('value', value);
    }

    get second(): string {
        return this._second;
    }

    set second(value: string) {
        this._setProperty('second', value);
    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._setProperty('text', value);
    }
});

customElements.define('dataplat-radio', class DataPlatRadio extends HTMLElement {
    private _text: string;
    private _name: string;
    private _disabled: boolean;
    private _title: string;
    private _value: string;
    private _checked: boolean;
    _input: HTMLInputElement | undefined;
    isRender: boolean;
    constructor() {
        super();
        this._text = '';
        this._name = '';
        this._title = '';
        this._value = '';
        this._disabled = false;
        this.isRender = false;
        this._checked = false;
    }

    connectedCallback() {
        if (!this.isRender) {
            this.append(this.GetLabel());
            this.isRender = true;
        }
    }
    disconnectedCallback() {
        try {
            this._input?.remove();
            this?.remove();

        } catch (ex) {
            console.log(ex);
        }

    }
    /** Коолекция своиств */
    static get observedAttributes() {
        return ['text', 'value', 'name', 'title', 'disabled', 'checked'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }
    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'text': this._setText(newValue); break;
            case 'value': this._setValue(newValue); break;
            case 'title': this._setTitle(newValue, oldValue); break;
            case 'checked': this._setChecked(newValue); break;
            case 'name': this._setName(newValue); break;
            case 'disabled': this._setDisabled(newValue); break;
        }
    }

    GetLabel() {
        let label = document.createElement('label');
        label.classList.add('dp-radio');

        DPElements.Global.CheckProperty(this, 'value');
        DPElements.Global.CheckProperty(this, 'name');
        DPElements.Global.CheckProperty(this, 'disabled');
        DPElements.Global.CheckProperty(this, 'checked');


        label.append(this._getInput());
        label.append(this._getCheckBox());
        DPElements.Global.CheckProperty(this, 'text');

        label.append(this._getTitle(this.text));
        return label;
    }


    /** Получаем чекбокс */
    _getInput() {
        this._input = document.createElement('input');
        this._input.classList.add('dp-radio-input');
        this._input.type = 'radio';
        this._input.name = this.name;
        this._input.checked = this.checked;
        this._input.value = this.value;
        this._input.disabled = this.disabled;
        this._input.addEventListener('change', (e) => this._checkChanged(e));
        return this._input;
    }
    /** Получаем элемент чекбокса */
    _getCheckBox() {
        let span = document.createElement('span');
        span.classList.add('dp-radio-span');
        return span;
    }
    /** Получаем элемент название название/описание */
    _getTitle(name: string) {
        let span = document.createElement('span');
        span.classList.add('dp-check-name');
        span.innerText = name;
        return span;
    }



    /**
     * Задаем значение титла
     * @param newValue - Новое значение
     * @param oldValue - Старое значение
     */
    _setTitle(newValue: string, oldValue: string) {
        if (typeof newValue === 'string') {
            if (newValue !== oldValue) {
                this._title = newValue;
                this.setAttribute('title', newValue);
            }
        }

    }

    _checkChanged(event: Event) {
        let target = event.target as HTMLInputElement;
        if (target) {
            this.checked = target.checked;
        }
        let eventNew = new Event("changed", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
    }



    /** Задаем имя элемента */
    _setName(value: string) {
        if (value) {
            this._name = value;
            if (this._input) {
                this._input.name = value;
            }
        }
    }
    /** Задаем текс с лева от элемента */
    _setText(value: string) {
        let element = this.querySelector('.dp-check-name') as HTMLElement;
        if (value) {
            if (value === null) value = '';
            this._text = value;

            if (element) {
                element.innerText = value;
            }

        } else {
            this._text = '';
            if (element) {
                element.innerText = this._text;
            }
        }
    }
    /** Задаем значение элемента  */
    _setValue(value: string) {
        if (typeof value === 'string') {
            this._value = value;
        } else {

        }
        if (this._input) {
            this._input.value = this._value;
        }
    }
    _setChecked(value: boolean) {
        if (typeof value === 'boolean') {
            this._checked = value;
        } else {
            if (value === 'true') {
                this._checked = true;
            }
            if (value === 'false') {
                this._checked = false;
            }
        }
        if (this._input) {
            this._input.checked = this._checked;
        }
    }
    /** Задаем активночть элемента */
    _setDisabled(value: boolean) {
        if (typeof value === 'boolean') {
            if (this._input) {
                this._input.disabled = value;
                this._disabled = value;
            }

        } else {
            if (typeof value === 'string') {
                if (value === 'true') {
                    this._disabled = true;
                } else {
                    this._disabled = false;
                }
            }
            if (this._input) {
                this._input.disabled = this._disabled;
            }
        }
    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._setProperty('text', value);
    }
    get title(): string {
        return this._title;
    }

    set title(value: string) {
        this._setProperty('title', value);
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', value);
    }

    get name() {
        return this._name;
    }

    set name(value: string) {
        this._setProperty('name', value);
    }

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        this._setProperty('value', value);
    }

    get checked(): boolean {
        return this._checked;
    }
    set checked(value: boolean) {
        this._setProperty('checked', value);
    }
});


customElements.define('dataplat-checkbox', class DataPlatCheckBox extends HTMLElement {
    private _text: string;
    private _disabled: boolean;
    private _title: string;
    private _value: boolean;
    _input: HTMLInputElement | undefined;
    isRender: boolean;
    constructor() {
        super();
        this._text = '';
        this._title = '';
        this._value = false;
        this._disabled = false;
        this.isRender = false;
    }
    connectedCallback() {
        if (!this.isRender) {
            this.append(this._getLabel());
            this.isRender = true;
        }
    }
    disconnectedCallback() {
        try {
            this._input?.remove();
            this?.remove();

        } catch (ex) {
            console.log(ex);
        }

    }
    /** Колекция свойств */
    static get observedAttributes() {
        return ['text', 'value', 'title', 'disabled'];
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }
    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'text': this._setText(newValue); break;
            case 'value': this._setValue(newValue); break;
            case 'title': this._setTitle(newValue, oldValue); break;
            case 'disabled': this._setDisabled(newValue); break;
        }
    }

    _getLabel() {
        let label = document.createElement('label');
        label.classList.add('dp-check');
        DPElements.Global.CheckProperty(this, 'value');
        DPElements.Global.CheckProperty(this, 'disabled');


        label.append(this._getInput());
        label.append(this._getCheckBox());
        DPElements.Global.CheckProperty(this, 'text');
        DPElements.Global.CheckProperty(this, 'title');
        label.append(this._getTitle(this.text));
        label.append(this._getIcon());
        return label;
    }
    /**
     * Задаем значение титла
     * @param newValue - Новое значение
     * @param oldValue - Старое значение
     */
    _setTitle(newValue: string, oldValue: string) {
        if (typeof newValue === 'string') {
            if (newValue !== oldValue) {
                this._title = newValue;
                this.setAttribute('title', newValue);
            }
        }

    }

    /** Получаем чекбокс */
    _getInput() {
        this._input = document.createElement('input');
        this._input.classList.add('dp-check-input');
        this._input.type = 'checkbox';
        this._input.checked = this.value;
        this._input.disabled = this.disabled;
        this._input.addEventListener('change', (e) => this._checkChanged(e));
        return this._input;
    }
    /** Получаем элемент чекбокса */
    _getCheckBox() {
        let span = document.createElement('span');
        span.classList.add('dp-check-box');
        return span;
    }
    /** Получаем элемент название название/описание */
    _getTitle(name: string) {
        let span = document.createElement('span');
        span.classList.add('dp-check-name');
        span.innerText = name;
        return span;
    }
    /**Получаем элемент иконка */
    _getIcon() {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('dp-check-icon');
        svg.setAttribute('viewBox', '0 0 22 22');
        svg.insertAdjacentHTML('afterbegin', '<path class="tick" stroke="defaulColor" fill="none" stroke-linecap="round" stroke-width="4" d="M4 10l5 5 9-9"></path>');
        return svg;
    }

    _checkChanged(event: Event) {
        let target = event.target as HTMLInputElement;
        if (target) {
            this.value = target.checked;
        }
        let eventNew = new Event("changed", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
    }




    /** Задаем значение элементу */
    _setValue(value: boolean) {
        if (typeof value === 'boolean') {
            this._value = value;
        } else {
            if (value === 'true') {
                this._value = true;
            }
            if (value === 'false') {
                this._value = false;
            }
        }
        if (this._input) {
            this._input.checked = this._value;
        }
    }
    /** Задаем надпись справа от элемента */
    _setText(value: string) {
        let element = this.querySelector('.dp-check-name') as HTMLElement;
        if (value) {
            if (value === null) value = '';
            this._text = value;

            if (element) {
                element.innerText = value;
            }
        } else {
            this._text = '';
            if (element) {
                element.innerText = '';
            }
        }
    }

    _setDisabled(value: boolean) {
        if (typeof value === 'boolean') {
            if (this._input) {
                this._input.disabled = value;
            }
            this._disabled = value;
        } else {
            if (typeof value === 'string') {
                if (value === 'true') {
                    this._disabled = true;
                }
                if (value === 'false') {
                    this._disabled = false;
                }
                if (this._input) {
                    this._input.disabled = this._disabled;
                }
            }

        }
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', value);

    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._setProperty('text', value);
    }

    get value(): boolean {
        return this._value;
    }

    set value(value: boolean) {
        this._setProperty('value', value);
    }

    get title() {
        return this._title;
    }

    set title(value: string) {
        this._setProperty('title', value);
    }
});

customElements.define('dataplat-search', class DataplatSearch extends HTMLElement {
    private _value: string;
    private _disabled: boolean;
    private _sorting: boolean;
    private _tree: boolean;
    private _refresh: boolean;
    private _statemenu: boolean;
    menu: boolean;
    _visible: boolean;
    _menuVisible: boolean;
    _input: HTMLInputElement | undefined;
    _menuElement: HTMLUListElement | undefined;
    _button: HTMLButtonElement | undefined;
    isRender: boolean;
    constructor() {
        super();
        this._statemenu = false;
        this._visible = true;
        this._value = '';
        this._sorting = false;
        this._tree = false;
        this._refresh = false;
        this.menu = false;
        this._menuVisible = false;
        this._disabled = false;
        this.isRender = false;
    }
    connectedCallback() {
        if (!this.isRender) {
            this.classList.add('dp-search-box');
            this.append(this._getInput());
            this.append(this._getSearchButton());

            DPElements.Global.CheckProperty(this, 'refresh', false);
            DPElements.Global.CheckProperty(this, 'sorting', false);

            if (this.sorting === true) {
                this.menu = true;
            }
            if (this.refresh === true) {
                this.menu = true;
            }
            DPElements.Global.CheckProperty(this, 'tree', false);
            if (this.tree === true) {
                this.menu = true;
            }
            DPElements.Global.CheckProperty(this, 'value');
            DPElements.Global.CheckProperty(this, 'disabled');
            if (this.menu === true) {
                this.append(this._getmenuButton());
                document.body.append(this._getmenuList());
                this._setMenuPosition();
            }

            this.isRender = true;

            this._resizeTracking();
        }
    }
    disconnectedCallback() {
        try {
            this._menuElement?.remove();
            this._button?.remove();
            this?.remove();
        } catch (ex) {
            console.log(ex);
        }

    }
    static get observedAttributes() {
        return ['disabled', 'value', 'tree', 'sorting'];
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    private _resizeTracking() {
        let min = 150;
        let observe = new ResizeObserver(result => {
            let width = this.offsetWidth;
            let change = true;
            if (width <= min && this._visible === true || width >= min && this._visible === false) {
                let menuBtn = this.querySelector('.dp-search-button-menu') as HTMLButtonElement;
                if (width <= min) {
                    if (this._input) {
                        this._input.dataset.visible = 'false';
                    }
                    if (menuBtn) {
                        menuBtn.dataset.visible = 'false';
                    }
                    this._visible = false;

                } else {
                    if (this._input) {
                        this._input.dataset.visible = 'true';
                    }
                    if (menuBtn) {
                        menuBtn.dataset.visible = 'true';
                    }
                    this._visible = true;
                }
            }

        });

        observe.observe(this);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'value': this._setValue(newValue); break;
            case 'disabled': this._setDisabled(newValue); break;
            case 'statemenu': this._setMenuState(newValue); break;
            case 'menuVisible': ; break;
        }
    }
    /** Получаем объект поле поиска */
    private _getInput() {
        this._input = document.createElement('input');

        this._input.type = 'text';
        this._input.classList.add('dp-search-input');
        this._input.placeholder = 'Поиск...';
        this._input.dataset.visible = 'true';
        this._input.addEventListener('input', (e) => this._inputChanged(e));
        this._input.addEventListener('keydown', (e) => this._searchKeyCkick(e));

        return this._input;
    }
    /** Получаем обект кнопки нажатия поиска */
    private _getSearchButton() {
        this._button = document.createElement('button');
        this._button.classList.add('dp-search-button');
        this._button.disabled = true;
        this._button.insertAdjacentHTML('afterbegin', '<svg class="dp-icon-search-svg"><use xlink:href="' + DPElements.IconPath + 'search"></use></svg>');
        this._button.addEventListener('click', (e) => this._searchButtonClick(e));
        return this._button;
    }

    private _getmenuButton() {
        let button = document.createElement('button');
        button.classList.add('dp-search-button');
        button.classList.add('dp-search-button-menu');
        button.dataset.visible = 'true';
        button.insertAdjacentHTML('afterbegin', '<svg class="dp-icon-search-svg"><use xlink:href="' + DPElements.IconPath + 'menu-points"></use></svg>');
        button.addEventListener('click', (e) => this._menuButtonClick(e));
        button.dataset.search = 'search';
        return button;
    }

    /**
     * Получаем список меню 
     * @returns 
     */
    private _getmenuList() {
        this._menuElement = document.createElement('ul');
        this._menuElement.classList.add('dp-context-menu');
        this._menuElement.setAttribute('data-active', 'false');
        if (this.refresh === true) {
            this._menuElement.append(this._getMenuListButton('Обновить', 'refresh'));
        }
        if (this.tree === true) {
            this._menuElement.append(this._getMenuListButton('Развернуть все', 'double-down'));
            this._menuElement.append(this._getMenuListButton('Свернуть все', 'double-up'));
        }

        if (this.sorting === true) {
            this._menuElement.append(this._getMenuListButton('По возрастанию', 'sort-ascending'));
            this._menuElement.append(this._getMenuListButton('По убыванию', 'sort-desc'));
        }



        return this._menuElement;
    }
    /**
     * Создаем кнопку выпадающего списка
     * @param name - Название
     * @param icon - Иконка
     * @param method - Функция для подписки кнопки
     * @returns HTMLLIElement с кнопкой
     */
    private _getMenuListButton(name: string, icon: string): HTMLLIElement {
        let li = document.createElement('li');
        let button = document.createElement('button');
        let p = document.createElement('p');
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        li.classList.add('dp-search-item');
        button.classList.add('dp-search-item-button');
        svg.classList.add('dp-icon-button-svg');
        svg.insertAdjacentHTML('afterbegin', `<use xlink:href="${DPElements.IconPath + icon}"></use>`);
        p.classList.add('dp-group-button-name');
        p.innerText = name;
        button.append(svg);
        button.append(p);
        switch (icon) {
            case 'double-down': button.addEventListener('click', (e) => this._expandAllClick(e)); break;
            case 'double-up': button.addEventListener('click', (e) => this._collapseAllClick(e)); break;
            case 'sort-ascending': button.addEventListener('click', (e) => this._ascendingClick(e)); break;
            case 'sort-desc': button.addEventListener('click', (e) => this._descendingClick(e)); break;
            case 'refresh': button.addEventListener('click', (e) => this._refreshClick(e)); break;
        }

        li.append(button);
        return li;
    }

    /**
     * Событие ввода текста в поле поиска
     * @param event - событие
     */
    _inputChanged(event: Event) {
        let target = event.target as HTMLInputElement;
        this._value = target.value;
        let eventNew = new Event("input", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
        this._buttonSearchState(this.value);
    }

    _buttonSearchState(value: string) {
        if (this._button) {
            if (value && value.length > 0) {
                this._button.disabled = false;
            } else {
                this._button.disabled = true;
            }
        }
    }

    _searchKeyCkick(event: KeyboardEvent) {
        if (event.key === "Enter") {
            let eventNew = new Event("search", { "bubbles": true, "cancelable": false });
            this.dispatchEvent(eventNew);
        }
    }
    /**
     * Событие нажатия кнопки поиска
     * @param event  - событие
     */
    _searchButtonClick(event: Event) {
        let eventNew = new Event("search", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
    }

    /**
     * Событие нажатия кнопки дополнительно
     * @param event  - событие
     */
    _menuButtonClick(event: Event) {
        this.statemenu = true;

        let eventNew = new Event("menu", event);
        this.dispatchEvent(eventNew);
    }

    _setMenuPosition() {
        let button = this.querySelector('.dp-search-button-menu') as HTMLButtonElement;
        let search = this._menuElement;
        if (button && search) {
            let coordinate = new DPElements.Coordinate(button, this._menuElement);

            search.style.left = `${(coordinate.left - 150) + coordinate.width}px`;
            search.style.top = `${coordinate.top + coordinate.height}px`;
        }
    }

    _openMenu() {
        if (this._menuElement) {
            this._setMenuPosition();
            this._menuElement.dataset.active = 'true';
            let eventNew = new Event("menu", { "bubbles": true, "cancelable": false });
            this.dispatchEvent(eventNew);


        }
    }




    /**
     * Событие нажатия кнопки свернуть все
     * @param event - событие
     */
    _collapseAllClick(event: Event) {
        let eventNew = new Event("collapse", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
        this.statemenu = false;
    }
    /**
     * Событие нажатия кнопки развернуть все
     * @param event  - событие
     */
    _expandAllClick(event: Event) {
        let eventNew = new Event("expand", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
        this.statemenu = false;
    }
    /**
     * Событие кнопки сортировка по возрастанию
     * @param event - событие
     */
    _ascendingClick(event: Event) {
        let eventNew = new Event("ascending", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
        this.statemenu = false;
    }

    /**
     * Событие кнопки сортировка по убыванию
     * @param event - событие
     */
    _descendingClick(event: Event) {
        let eventNew = new Event("descending", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
        this.statemenu = false;
    }
    /**
     * Событие кнопки обновить
     * @param event - событие
     */
    _refreshClick(event: Event) {
        let eventNew = new Event("refresh", { "bubbles": true, "cancelable": false });
        this.dispatchEvent(eventNew);
        this.statemenu = false;
    }
    /** Задаем значение полю поиска */
    _setValue(value: string) {
        if (value) {
            this._value = value;
            if (this._input) {
                this._input.value = value;
            }
        } else {
            if (this._input) {
                this._input.value = '';
            }
        }
    }

    _setMenuState(value: boolean) {
        if (value !== undefined && value !== null) {
            let result = this._statemenu;
            if (typeof value === 'boolean') {
                this._statemenu = value;
            }
            if (typeof value === 'string') {
                if (value === 'true') {
                    this._statemenu = true;
                }
                if (value === 'false') {
                    this._statemenu = false;
                }
            }
            if (result !== this._statemenu) {

                if (this._statemenu === true) {
                    this._openMenu();
                    document.addEventListener('click', this._removeListener);
                } else {
                    if (this._menuElement) {
                        this._menuElement.dataset.active = 'false';
                    }
                    document.removeEventListener('click', this._removeListener);
                }
            }

        }
    }

    _removeListener = (e: Event) => {
        let target = e.target as HTMLElement;
        let remove = true;
        if (target) {
            if (target.dataset.search) {
                if (target.dataset.search === 'search') {
                    remove = false;
                }
            }
        }

        if (remove === true) {
            this.statemenu = false;
        }
    };


    _setDisabled(value: boolean) {
        if (typeof value === 'boolean') {
            this._disabled = value;
            if (this._input) {
                this._input.disabled = value;
            }
            this.querySelectorAll('button').forEach(element => {
                element.disabled = value;
            });
        } else {
            if (typeof value === 'string') {
                if (value === 'true') {
                    this._disabled = true;
                }
                if (value === 'false') {
                    this._disabled = false;
                }
                if (this._input) {
                    this._input.disabled = this._disabled;
                }
                this.querySelectorAll('button').forEach(element => {
                    element.disabled = this._disabled;;
                });
            }
        }
    }

    get tree() {
        return this._tree;
    }
    set tree(value: boolean) {
        if (this.isRender === false) {
            this._tree = value;
        } else {
            throw new Error('Свойство tree доступно только для чтения');
        }
    }
    get refresh() {
        return this._refresh;
    }
    set refresh(value: boolean) {
        if (this.isRender === false) {
            this._refresh = value;
        } else {
            throw new Error('Свойство refresh доступно только для чтения');
        }
    }
    get sorting() {
        return this._sorting;
    }
    set sorting(value: boolean) {
        if (this.isRender === false) {
            this._sorting = value;
        } else {
            throw new Error('Свойство sorting доступно только для чтения');
        }
    }
    get disabled() {
        return this._disabled;
    }
    set disabled(value: boolean) {
        this._setProperty('disabled', value);
    }
    get statemenu() {
        return this._statemenu;
    }
    set statemenu(value: boolean) {
        this._setProperty('statemenu', value);
    }
    get value() {
        return this._value;
    }
    set value(value: string) {
        this._setProperty('value', value);

    }
});

customElements.define('dataplat-datepicker', class DataplatDatepicker extends HTMLElement {
    isRender: boolean;
    // #region variables
    private _nowDate: Date;
    private _titleValue: string;
    private _date: number;
    private _day: string;
    private _dayNumber: number;
    private _dayShort: string;
    private _month: string;
    private _monthNumber: number;
    private _maxMonth: number | null;
    private _maxDay: number | null;
    private _maxYear: number | null;
    private _minYear: number | null;
    private _minDay: number | null;
    private _minMonth: number | null;
    private _monthShort: string;
    private _year: number;
    private _selectedDate: number;
    private _selectedMonth: number;
    private _selectedYear: number;
    private _selectedTime: string;
    private _hours: number | string;
    private _minutes: number | string;
    private _seconds: number | string;
    private _depth: number;
    private _weeks: string[] = [];
    private _isAnimation: boolean;
    private _isBack: boolean;
    // #endregion variables
    // #region properties
    private _value: Date | string;
    private _disabled: boolean;
    private _enable: boolean;
    private _readonly: boolean;
    private _format: string;
    private _time: boolean;
    private _interval: number;
    private _dateFormat: string;
    private _timeFormat: string;
    private _maxTime: string;
    private _max: Date;
    private _min: Date;
    private _isOpen: boolean;
    private _isOpenTime: boolean;
    // #endregion properties
    // #region HTMLElements
    private _DatePicker: HTMLElement | undefined;
    private _Control: HTMLElement | undefined;
    private _Input: HTMLInputElement | undefined;
    private _Calendar: HTMLDivElement | undefined;
    private _CalendarButton: HTMLButtonElement | undefined;
    private _ClockButton: HTMLButtonElement | undefined;
    private _Week: HTMLDivElement | undefined;
    private _Header: HTMLDivElement | undefined;
    private _PrevButton: HTMLButtonElement | undefined;
    private _NextButton: HTMLButtonElement | undefined;
    private _MonthButton: HTMLButtonElement | undefined;
    private _Dates: HTMLDivElement | undefined;
    private _CurrentDay: HTMLButtonElement | undefined;
    private _Years: HTMLDivElement | undefined;
    private _Time: HTMLElement | undefined;
    private _AllYears: HTMLDivElement | undefined;
    private _Months: HTMLDivElement | undefined;
    private _Icons: HTMLElement | undefined;

    // #endregion HTMLElements
    constructor() {
        super();

        let date = new Date();
        this._titleValue = '';
        this._timeFormat = 'HH:mm';
        this._format = 'DD.MM.YYYY HH:mm';
        this._dateFormat = 'DD.MM.YYYY HH:mm';
        this._isOpen = false;
        this._isAnimation = true;
        this._isOpenTime = false;
        this._readonly = false;
        this._isBack = false;
        this._time = true;
        this._depth = 0;
        this._max = new Date(2099, 11, 31);
        this._min = new Date(1900, 0, 1);
        this._value = date;
        this._disabled = false;
        this._enable = true;
        this._nowDate = date;
        this._date = date.getDate();
        this._dayNumber = date.getDay() + 1;
        this._day = date.toLocaleString('default', { weekday: 'long' });
        this._dayShort = date.toLocaleString('default', { weekday: 'short' });
        this._year = date.getFullYear();
        this._month = date.toLocaleString('default', { month: 'long' });
        this._monthShort = date.toLocaleString('default', { month: 'short' });
        this._monthNumber = date.getMonth() + 1;
        this._maxMonth = null;
        this._maxDay = null;
        this._maxYear = null;
        this._minYear = null;
        this._minDay = null;
        this._minMonth = null;
        this._maxTime = '';
        this._selectedDate = this._date;
        this._selectedMonth = this._monthNumber;
        this._selectedYear = this._year;
        this._hours = date.getHours();
        this._seconds = date.getSeconds();
        this._minutes = date.getMinutes();
        this._selectedTime = `${this._hours} ${this._minutes}`;
        this._interval = 30;
        this._weeks = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        this.isRender = false;
    }

    connectedCallback() {
        if (!this.isRender) {
            this._handlerParams();
            /** Следим за шириной экрана */
            window.addEventListener('resize', () => this._resizeWindow());
            this.append(this._getControl());
            const isSub = this._checkSubList();
            if (!isSub) {
                document.body.append(this._getCalendar(), this._getTime(this._interval));
            }
            this._handlerProperty();
            this.isRender = true;
        }
    }

    /** Проверка на нахождение компонента в контекстном меню */
    private _checkSubList() {
        let sublist = this._DatePicker?.closest('.dp-menu-sublist');
        if (sublist) {
            sublist?.append(this._getCalendar(), this._getTime(this._interval));
            if (this._Calendar && this._Time) {
                this._Calendar.dataset.sub = 'true';
                this._Time.dataset.sub = 'true';
                return true;
            }
        }
    }

    disconnectedCallback() {
        try {
            this._DatePicker?.remove();
            this._Calendar?.remove();
            this._Time?.remove();
            this?.remove();
            this.isRender = false;
            window.removeEventListener('resize', this._resizeWindow);
        } catch (ex) {
            console.log(ex);
        }
    }

    static get observedAttributes() {
        return [
            'value',
            'format',
            'max',
            'min',
            'readonly',
            'time',
            'timeformat',
            'interval',
            'maxtime',
            'enable',
            'disabled'
        ];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'enable':
                if (typeof newValue === 'boolean') {
                    if (newValue) this._setEnable(false);
                    if (!newValue) this._setEnable(true);
                } else {
                    if (newValue === 'false') this._setEnable(true);
                    if (newValue === 'true') this._setEnable(false);
                }
                break;
            case 'disabled':
                if (typeof newValue === 'boolean') {
                    this._setEnable(newValue);
                } else {
                    if (newValue === 'false') this._setEnable(false);
                    if (newValue === 'true') this._setEnable(true);
                }
                break;
            case 'value':
                this._setValue(newValue);
                break;
            case 'dateFormat':
            case 'format':
                this._setFormat(newValue);
                break;
            case 'min':
                this._setMin(newValue);
                break;
            case 'max':
                this._setMax(newValue);
                break;
            case 'readonly':
                if (typeof newValue === 'boolean') {
                    this._setReadOnly(newValue);
                } else {
                    if (newValue === 'false') this._setReadOnly(false);
                    if (newValue === 'true') this._setReadOnly(true);
                }
                break;
            case 'time':
                if (typeof newValue === 'boolean') {
                    this._setTime(newValue);
                } else {
                    if (newValue === 'false') this._setTime(false);
                    if (newValue === 'true') this._setTime(true);
                }
                break;
            case 'timeFormat':
            case 'timeformat':
                this._setTimeFormat(newValue);
                break;
            case 'interval':
                this._setInterval(newValue);
                break;
            case 'animation':
                if (typeof newValue === 'boolean') {
                    this._setAnimation(newValue);
                } else {
                    if (newValue === 'false') this._setAnimation(false);
                    if (newValue === 'true') this._setAnimation(true);
                }
                break;
            case 'maxTime':
            case 'maxtime':
                if (typeof newValue === 'boolean') {
                    this._setMaxTime(newValue);
                } else {
                    if (newValue === 'false') this._setMaxTime(false);
                    if (newValue === 'true') this._setMaxTime(true);
                }
                break;
        }
    }

    /** Обработка параметров */
    private _handlerParams() {
        DPElements.Global.CheckProperty(this, 'animation', false);
    }

    /** Обработка свойств */
    private _handlerProperty() {
        DPElements.Global.CheckProperty(this, 'disabled');
        DPElements.Global.CheckProperty(this, 'enable');
        DPElements.Global.CheckProperty(this, 'value');
        DPElements.Global.CheckProperty(this, 'max');
        DPElements.Global.CheckProperty(this, 'min');
        DPElements.Global.CheckProperty(this, 'maxTime');
        DPElements.Global.CheckProperty(this, 'timeFormat');
        DPElements.Global.CheckProperty(this, 'time');
        DPElements.Global.CheckProperty(this, 'format');
        DPElements.Global.CheckProperty(this, 'dateFormat');
        DPElements.Global.CheckProperty(this, 'interval');
        DPElements.Global.CheckProperty(this, 'readonly');
    }

    /**
     * Получаем дату
     * @param date - дата
     * @param lang - язык
     */
    private _getCollectionDates(date: Date | null = null, lang = 'default') {
        date = date ?? new Date();
        return {
            date: date.getDate(),
            dayNumber: date.getDay() + 1,
            year: date.getFullYear(),
            monthNumber: date.toLocaleString(lang, { month: 'long' }),
            month: date.getMonth() + 1
        };
    }

    /**
     * Событие при клике вне окон календаря и времени
     * @param event - событие
     */
    private _closeAllWindows = (event: Event) => {
        const target = event.target as HTMLElement;
        if (
            !target.closest('.dp-datepicker-icon-calendar') &&
            !target.closest('.dp-datepicker-icon') &&
            !target.closest('.dp-datepicker-calendar') &&
            !target.closest('.dp-datepicker-month-btn') &&
            !target.closest('.dp-datepicker-time')
        ) {
            if (this._isOpenTime) {
                this._time = false;
                this._closeTime();
            }
            if (this._isOpen) {
                this._isOpen = false;
                this._closeCalendar();
                if (this._isBack)
                    this._DatePicker?.classList.remove('dp-datepicker-background');
            }
        }
    };

    /**
     *  возвращает дату и время для отображения в input
     * @param format принимает выбранный формат Даты
     * @returns дата и время
     */
    private _replaceFormat(format: string) {
        let date = this._date < 10 ? '0' + this._date : this._date;
        let monthNumber = this._monthNumber < 10 ? '0' + this._monthNumber : this._monthNumber;
        let hours =
        typeof this._hours === 'number' &&  this._hours < 10  ? '0' + this._hours : this._hours;
        let minutes =
            typeof this._minutes === 'number' && this._minutes < 10
                ? '0' + this._minutes
                : this._minutes;
        let seconds =
        typeof this._seconds === 'number' &&  this._seconds < 10
                ? '0' + this._seconds
                : this._seconds;
        return format
            .replace(/\bYYYY\b/, `${this._year}`)
            .replace(/\byyyy\b/, `${this._year}`)
            .replace(/\bDD\b/, date.toString())
            .replace(/\bdd\b/, date.toString())
            .replace(/\bMM\b/, monthNumber.toString())
            .replace(/\bHH\b/, hours.toString())
            .replace(/\bmm\b/, minutes.toString())
            .replace(/\bss\b/, seconds.toString());
    }

    /**
     * Получаем данные на основе изменения даты
     * @param date - дата, по умолчанию 0
     * @param i - число, определяющее месяц с учетом вычета из этого числа
     * @returns объект с данными
     */
    private _getDay(date: number, i: number = 1) {
        return this._getCollectionDates(new Date(this._year, this._monthNumber - i, date));
    }

    /**
     * возвращает количество дней в месяце
     * @returns кол-во дней в месяце
     */
    private _getDaysInMonth() {
        return 32 - new Date(this._year, this._monthNumber - 1, 32).getDate();
    }

    /** Событие при изменении ширины экрана */
    private _resizeWindow = () => {
        const width = window.innerWidth;
        if (width) {
            if (width < 769) {
                this._isBack = true;
                if (this._Calendar?.getAttribute('style')) {
                    this._Calendar?.removeAttribute('style');
                }
                if (this._Time?.getAttribute('style')) {
                    this._Time?.removeAttribute('style');
                }
                if (this._isOpen || this._isOpenTime) {
                    if (!this._DatePicker?.classList.contains('dp-datepicker-background')) {
                        this._DatePicker?.classList.add('dp-datepicker-background');
                    }
                }
            } else {
                this._isBack = false;
                if (this._DatePicker?.classList.contains('dp-datepicker-background')) {
                    this._DatePicker?.classList.remove('dp-datepicker-background');
                }
                if (this._isOpen || this._isOpenTime) this._checkPosition();
            }
        }
    };

    /**
     * получаем панель управления в DOM
     * @returns datepicker
     */
    private _getControl() {
        this._DatePicker = document.createElement('div');
        let datepicker = this._DatePicker;
        datepicker.className = 'dp-datepicker';

        this._Control = document.createElement('div');
        let control = this._Control;
        control.className = 'dp-datepicker-control';
        control.classList.add('dp-datepicker-control-hover');
        control.classList.add('dp-datepicker-control-act');

        let inputContainer = document.createElement('div');
        inputContainer.className = 'dp-datepicker-input-container';

        this._Icons = document.createElement('div');
        let icons = this._Icons;
        icons.className = 'dp-datepicker-icons';

        control.append(inputContainer, icons);
        inputContainer.append(this._getInput());
        if (this._time) {
            icons.append(this._getCalendarIcon(), this._getClockButton());
        } else {
            icons.append(this._getCalendarIcon());
        }

        datepicker.append(control);

        /** Следим за шириной экрана */
        window.addEventListener('resize', this._resizeWindow);

        return datepicker;
    }

    /**
     * получаем input в DOM
     * @returns HTMLElement input
     */
    private _getInput() {
        this._Input = document.createElement('input');
        this._Input.classList.add('dp-datepicker-input');
        this._Input.type = 'text';

        if (this._value) {
            this.value = this._getNewDate(this._replaceFormat(this.dateFormat));
        }

        this._setMaxLength();

        this._Input.addEventListener('change', (event) => {
            let newDate = this._changeValue(event);
            if (newDate) {
                this.value = newDate;
                this._createNewEvent(event);
                this._getDates();
            }
        });

        this._Input.addEventListener('keypress', (event) => {
            this._dateInput(event);
        });

        return this._Input;
    }

    /** Устанавливаем максимально допустимую длину символов, разрешенных для ввода. */
    private _setMaxLength() {
        if (this._dateFormat?.split('').indexOf('s') !== -1 && this._time) {
            this._Input?.setAttribute('maxlength', '19');
        } else if (this._dateFormat?.split('').indexOf('m') !== -1 && this._time) {
            this._Input?.setAttribute('maxlength', '16');
        } else {
            this._Input?.setAttribute('maxlength', '10');
        }
    }

    /**
     * Редактируем поле ввода после нажатия клавиши
     * @param event - событие нажатия на клавиатуру
     */
    private _dateInput(event: KeyboardEvent) {
        let input = this._Input;
        if (input) {
            const lengthVal = input.value.length;

            if (lengthVal === 2) input.value += '.';
            if (lengthVal === 2 && event.key !== '1') input.value += '0';
            if (lengthVal === 5) input.value += '.';
            if (lengthVal === 10) input.value += ' ';
            const maxLength = input.getAttribute('maxlength');
            if (maxLength) {
                if (maxLength > '10') {
                    if (lengthVal === 13) input.value += ':';
                }
                if (maxLength > '16') {
                    if (lengthVal === 16) input.value += ':';
                }
            }
        }
    }

    /**
     *  Событие при ручном вводе даты
     * @param event - событие
     */
    private _changeValue(event: Event) {
        let target = event.target as HTMLInputElement;
        if (target && this._Control) {
            let timestamp;
            let value = target.value.split('.');
            if (
                this.dateFormat.split('.')[0] === 'DD' ||
                this.dateFormat.split('.')[0] === 'dd'
            ) {
                let valueStr = `${value[1]}.${value[0]}.${value[2]}`;
                timestamp = Date.parse(valueStr);
            } else {
                timestamp = Date.parse(target.value);
            }
            if (!isNaN(timestamp)) {
                let newDate = new Date(timestamp);
                let year = newDate.getFullYear();
                let checkCurrentDate =
                    year.toString().length < 4 || newDate > this.max || newDate < this.min;
                if (checkCurrentDate) {
                    this._Control.classList.add('dp-datepicker-control-error');
                } else {
                    this._closeYears();
                    this._closeAllMonths();
                    this._closeAllYears();
                    return newDate;
                }
            } else if (value.length === 1) {
                this.value = '';
                // return this._getNewDate(this._replaceFormat(this.dateFormat));
            } else {
                this._Control.classList.add('dp-datepicker-control-error');
            }
        }
    }

    /**
     * Создаем событие при изменении значения даты
     * @param event - событие
     */
    private _createNewEvent(event: Event) {
        let eventNew = new Event('changed', event);
        this.dispatchEvent(eventNew);
    }

    /**
     * Преобразуем в нужный формат и отдаем дату в формате Date
     * @param newDate - переданная дата в формате string
     * @returns дата
     */
    private _getNewDate(newDate: string) {
        let value = newDate.split('.');
        if (this.dateFormat.split('.')[0] === 'DD' || this.dateFormat.split('.')[0] === 'dd') {
            let valueStr = `${value[1]}.${value[0]}.${value[2]}`;
            return new Date(valueStr);
        } else {
            return new Date(newDate);
        }
    }

    /** Обновляем выбранную дату */
    private _updateSelectedDay() {
        this._selectedDate = this._date;
        this._selectedMonth = this._monthNumber;
        this._selectedYear = this._year;
    }

    /**
     * Получаем иконку календаря
     * @returns button
     */
    private _getCalendarIcon() {
        this._CalendarButton = document.createElement('button');
        let calendarBtn = this._CalendarButton;
        calendarBtn.classList.add('dp-datepicker-btn');
        calendarBtn.setAttribute('data-date', 'date');

        calendarBtn.insertAdjacentHTML(
            'afterbegin',
            '<svg class="dp-datepicker-icon-calendar"><use xlink:href="' + DPElements.IconPath + 'calendar"></use></svg>'
        );

        calendarBtn.addEventListener('mousedown', (event) => {
            if (this._isOpenTime) this._closeTime();
            this._calendarBtnClick(event);
            this._checkPosition();
            this._updateHeader();
        });

        return calendarBtn;
    }

    /** Проверка позиция контрола для установления необходимой позиции календарю */
    private _checkPosition() {
        let calendar = this._Calendar;
        let time = this._Time;

        calendar?.removeAttribute('style');
        let coordControl: DPElements.Coordinate | undefined;
        if (this._Calendar && this._Control) {
            coordControl = new DPElements.Coordinate(this._Control, this._Calendar);
        }


        let calendarWidth = this._Calendar?.offsetWidth;
        let calendarHeight = this._Calendar?.offsetHeight;

        if (coordControl) {
            if (time) {
                if (window.innerWidth < 769) {
                    time.removeAttribute('style');
                } else {
                    time.style.width = `${coordControl.width}px`;
                    time.style.top = `${coordControl.top + coordControl.height + 5}px`;
                    time.style.left = `${coordControl.left}px`;
                    time.style.height = `${coordControl.distanceOnBottom - 10}px`;
                }
            }

            if (calendar && calendarWidth && calendarHeight) {
                if (window.innerWidth < 769) {
                    calendar?.removeAttribute('style');
                } else {
                    if (coordControl.distanceOnBottom > calendarHeight) {
                        calendar.style.top = `${coordControl.top + coordControl.height + 5}px`;
                        calendar.style.left = `${coordControl.left}px`;
                    } else if (coordControl.top > calendarHeight) {
                        coordControl.bottom = coordControl.windowHeight - coordControl.top + 5;
                        calendar.style.bottom = `${coordControl.bottom}px`;
                        calendar.style.left = `${coordControl.left}px`;
                    } else {
                        calendar.style.left = `${coordControl.left}px`;
                    }


                    if (coordControl.distanceOnRight < 80 && coordControl.distanceOnRight > 0) {
                        calendar.style.left = `${coordControl.left - (calendarWidth - coordControl.width)}px`;
                    } else if (coordControl.distanceOnRight <= 0 && coordControl.left > calendarWidth) {
                        calendar.style.left = `${coordControl.left - calendarWidth - 5}px`;
                        calendar.style.top = `${coordControl.top - coordControl.top}px`;
                        calendar.style.bottom = '';
                    } else if (coordControl.left <= 0 && coordControl.distanceOnRight > calendarWidth) {
                        calendar.style.left = `${coordControl.right + 5}px`;
                        calendar.style.top = `${coordControl.top - coordControl.top}px`;
                    }
                }
            }
        }
    }

    /**
     * Событие при нажатии на иконку календаря
     * @param event - событие
     */
    private _calendarBtnClick(event: Event) {
        event.preventDefault();
        if (this._isOpen) {
            this._closeCalendar();
            if (this._isBack) {
                this._DatePicker?.classList.remove('dp-datepicker-background');
            }
        } else {
            if (this._isBack) {
                this._DatePicker?.classList.add('dp-datepicker-background');
            }
            this._openCalendar();
        }
    }

    /**
     * Получаем календарь
     * @returns
     */
    private _getCalendar() {
        this._Calendar = document.createElement('div');
        let calendar = this._Calendar;
        calendar.classList.add('dp-datepicker-calendar');

        calendar.append(this._getHeader(), this._getDates(), this._getFooter());
        return calendar;
    }

    /**
     * Октрываем календарь
     */
    private _openCalendar() {
        let calendar = this._Calendar;
        this._isOpen = true;
        if (this._isAnimation) {
            if (!this._isBack) {
                calendar?.classList.remove('dp-datepicker-close');
                calendar?.classList.add('dp-datepicker-open');
            } else {
                calendar?.classList.remove('dp-datepicker-close-min');
                calendar?.classList.add('dp-datepicker-open-min');
            }
        } else {
            calendar?.classList.add('dp-datepicker-close-anim');
        }
        window.addEventListener('click', this._closeAllWindows, { capture: true });
    }

    /**
     * Закрываем календарь
     */
    private _closeCalendar() {
        let calendar = this._Calendar;
        this._isOpen = false;
        if (this._isAnimation) {
            if (!this._isBack) {
                calendar?.classList.remove('dp-datepicker-open');
                calendar?.classList.add('dp-datepicker-close');
                setTimeout(() => {
                    calendar?.classList.remove('dp-datepicker-close');
                }, 280);
                calendar?.classList.remove('dp-datepicker-open-min');
            } else {
                calendar?.classList.remove('dp-datepicker-open-min');
                calendar?.classList.add('dp-datepicker-close-min');
                setTimeout(() => {
                    calendar?.classList.remove('dp-datepicker-close-min');
                }, 280);
                calendar?.classList.remove('dp-datepicker-open');
            }
        } else {
            calendar?.classList.remove('dp-datepicker-close-anim');
        }
        window.removeEventListener('click', this._closeAllWindows, { capture: true });
    }

    /**
     * Получаем окно выбора времени
     * @param interval - указанный интервал
     * @returns
     */
    private _getTime(interval: number) {
        if (!this._Time) {
            this._Time = document.createElement('div');
        }
        let time = this._Time;
        time.innerHTML = '';
        time.classList.add('dp-datepicker-time');
        this._updateSelectedTime(this._hours, this._minutes, this._seconds);

        let int = (60 / interval) * 24;
        let hour = 0;
        let minute = 0;
        let stop = 60 / interval;

        for (let i = 0; i < int; i++) {
            minute += interval;
            if (i % stop === 0 && i !== 0) {
                hour++;
                minute = 0;
            }
            if (i === 0) minute = 0;

            let timeBtn = document.createElement('button');
            timeBtn.classList.add('dp-datepicker-time-btn');

            let hours = hour < 10 ? '0' + hour : hour;
            let minutes = minute < 10 ? '0' + minute : minute;

            if (this._timeFormat?.split('').indexOf('s') !== -1) {
                timeBtn.innerHTML = `${hours}:${minutes}:00`;
            } else {
                timeBtn.innerHTML = `${hours}:${minutes}`;
            }

            if (this._selectedTime === timeBtn.innerHTML) {
                timeBtn.classList.add('dp-datepicker-current-active');
            }

            timeBtn.setAttribute('data-time', `${hours}:${minutes}`);
            timeBtn.addEventListener('click', (event) => {
                this._clickOnTime(event);
                this._createNewEvent(event);
                this._closeTime();
            });

            let maxDateIf =
                this._maxYear === this._year &&
                this._maxDay === this._date &&
                this._maxMonth === this._monthNumber;

            if (this.maxTime && maxDateIf) {
                if (timeBtn.innerHTML >= this.maxTime) {
                    timeBtn.innerHTML = `${this.maxTime}`;
                    if (this._selectedTime === timeBtn.innerHTML) {
                        timeBtn.classList.add('dp-datepicker-current-active');
                    }
                    time.append(timeBtn);
                    break;
                }
            }
            time.append(timeBtn);
        }

        return time;
    }

    /**
     * Получаем иконку времени
     * @returns
     */
    private _getClockButton() {
        this._ClockButton = document.createElement('button');
        let ClockButton = this._ClockButton;
        ClockButton.classList.add('dp-datepicker-btn');
        ClockButton.setAttribute('data-date', 'date');

        ClockButton.insertAdjacentHTML(
            'afterbegin',
            '<svg class="dp-datepicker-icon"><use xlink:href="' + DPElements.IconPath + 'clock"></use></svg>'
        );

        ClockButton.addEventListener('click', (event) => {
            if (this._isOpen) this._closeCalendar();
            this._getTime(this._interval);
            this._timeBtnClick(event);
            this._checkPosition();
        });

        return ClockButton;
    }

    /**
     * Событие при клике на иконку времени
     * @param event - событие
     */
    private _timeBtnClick(event: Event) {
        event.preventDefault();
        if (this._isOpenTime) {
            this._closeTime();
        } else {
            this._openTime();
        }
    }

    /**
     * Открываем окно со временем
     */
    private _openTime() {
        if (!this._isOpenTime) {
            if (this._isBack) {
                this._DatePicker?.classList.add('dp-datepicker-background');
            }
            this._isOpenTime = true;
            if (this._isAnimation) {
                this._Time?.classList.remove('dp-datepicker-time-close');
                this._Time?.classList.add('dp-datepicker-time-open');
            } else {
                this._Time?.classList.add('dp-datepicker-close-anim');
            }
            window.addEventListener('click', this._closeAllWindows, { capture: true });
        }
    }

    /**
     * Закрываем окно со временем
     */
    private _closeTime() {
        if (this._isBack) {
            this._DatePicker?.classList.remove('dp-datepicker-background');
        }
        this._isOpenTime = false;
        if (this._isAnimation) {
            this._Time?.classList.add('dp-datepicker-time-close');
            this._Time?.classList.remove('dp-datepicker-time-open');
            setTimeout(() => {
                this._Time?.classList.remove('dp-datepicker-time-close');
            }, 120);
        } else {
            this._Time?.classList.remove('dp-datepicker-close-anim');
        }
        window.removeEventListener('click', this._closeAllWindows, { capture: true });
    }

    /**
     * Событие при клике на определенное время
     * @param event - событие
     */
    private _clickOnTime(event: Event) {
        event.preventDefault();
        const target = event.target as HTMLButtonElement;
        let hour = target.innerHTML;
        if (hour) {
            this._hours = hour.substring(0, 2);
            this._minutes = hour.substring(3, 5);
            this._seconds = hour.substring(6, 8);

            this._updateSelectedTime(this._hours, this._minutes, this._seconds);
        }

        this._year = this._selectedYear;
        this._monthNumber = this._selectedMonth;

        this.value = this._getNewDate(this._replaceFormat(this.dateFormat));
    }

    /**
     * Обновляем выбранное время
     * @param hour - часы
     * @param minute - минуты
     * @param second - секунды
     */
    private _updateSelectedTime(hour: number | string, minute: number | string, second: number | string) {
        let hours = typeof hour === 'number' && hour < 10 ? '0' + hour : hour;
        let minutes = typeof minute === 'number' && minute < 10  ? '0' + minute : minute;
        let seconds = typeof second === 'number' &&  second < 10   ? '0' + second : second;

        if (this._timeFormat?.split('').indexOf('s') === -1) {
            this._selectedTime = `${hours}:${minutes}`;
        } else {
            this._selectedTime = `${hours}:${minutes}:${seconds}`;
        }
    }

    /**
     * Получаем header календаря в DOM
     * @returns
     */
    private _getHeader() {
        this._Header = document.createElement('div');
        let header = this._Header;
        header.classList.add('dp-datepicker-calendar-header');

        header.append(this._getPrevBtn(), this._getMonthHeader(), this._getNextBtn());

        return header;
    }

    /**
     * Получаем кнопку для открытия других вкладок
     * @returns
     */
    private _getMonthHeader() {
        this._MonthButton = document.createElement('button');
        let month = this._MonthButton;
        month.addEventListener('mousedown', (event) => {
            this._clickOnHeaderMonth(event);
        });
        month.classList.add('dp-datepicker-month-head');

        this._titleValue = `${this._month} ${this._year}`;
        month.innerHTML = this._titleValue.charAt(0).toUpperCase() + this._titleValue.slice(1);

        return this._MonthButton;
    }

    /**
     * Событие при клике на кнопку открытия других вкладок
     * @param event - событие
     */
    private _clickOnHeaderMonth(event: Event) {
        event.preventDefault();
        if (this._depth < 3) this._depth += 1;

        if (this._depth === 3) {
            this._closeYears();
            this._openAllYears();
            this._getAllYears();
        }

        if (this._depth === 2) {
            this._closeAllMonths();
            this._openYears();
            this._getYears();
        }

        if (this._depth === 1) {
            this._getMonths();
            this._openAllMonths();
        }
    }

    /**
     * Получаем кнопку назад в DOM
     * @returns
     */
    private _getPrevBtn() {
        this._PrevButton = document.createElement('button');
        this._PrevButton.classList.add('dp-datepicker-header-btn');
        this._PrevButton.classList.add('dp-datepicker-prev-btn');
        this._PrevButton.addEventListener('mousedown', (event) => {
            this._clickOnPrevBtn(event);
        });
        return this._PrevButton;
    }

    /**
     * Событие при клики на кнопку назад
     * @param event - событие
     */
    private _clickOnPrevBtn(event: Event) {
        event.preventDefault();
        if (this._depth === 0) {
            this._prevMonth();
            this._Dates?.classList.remove('.dp-calendar-next');
            this._Dates?.classList.add('.dp-calendar-prev');
        } else if (this._depth === 2) {
            this._year = this._year - 10;
            this._getYears();
            this._updateHeader();
        } else if (this._depth === 3) {
            this._year = +this.min;
            this._getAllYears();
            this._updateHeader();
        } else {
            this._year -= 1;
            this._getMonths();
            this._updateHeader();
        }
    }

    /**
     * Получаем кнопку вперед в DOM
     * @returns
     */
    private _getNextBtn() {
        this._NextButton = document.createElement('button');
        this._NextButton.classList.add('dp-datepicker-header-btn');
        this._NextButton.classList.add('dp-datepicker-next-btn');
        this._NextButton.addEventListener('mousedown', (event) => {
            this._clickOnNextBtn(event);
        });
        return this._NextButton;
    }

    /**
     * Событие при клике на кнопку вперед
     * @param event - событие
     */
    private _clickOnNextBtn(event: Event) {
        event.preventDefault();
        if (this._depth === 0) {
            this._nextMonth();
            this._Dates?.classList.remove('.dp-calendar-prev');
            this._Dates?.classList.add('.dp-calendar-next');
        } else if (this._depth === 2) {
            this._year = this._year + 10;
            this._getYears();
            this._updateHeader();
        } else if (this._depth === 3) {
            this._year = +this.max;
            this._getAllYears();
            this._updateHeader();
        } else {
            this._year += 1;
            this._getMonths();
            this._updateHeader();
        }
    }

    /**
     * Обновляем данные при перелистовании календаря
     * @param lang - язык
     */
    private _updateNewDate(lang: string = 'russia') {
        this._value = new Date(this._year, this._monthNumber - 1);
        this._month = this._value.toLocaleString(lang, { month: 'long' });
    }

    /**
     * Получаем номер предыдущего месяца
     * @returns
     */
    private _getPreviousMonth() {
        if (this._monthNumber === 1) {
            return new Date(this._year - 1, 11);
        }

        return new Date(this._year, this._monthNumber - 2);
    }

    /**
     * Переход на предыдущий месяц
     * @returns предыдущий год
     */
    private _movePreviousMonth() {
        if (this._monthNumber === 1) {
            return this._movePreviousYear();
        }

        this._monthNumber = this._monthNumber - 1;
        this._updateNewDate();
    }

    /**
     * Переход на предыдущий год
     */
    private _movePreviousYear() {
        this._monthNumber = 12;
        this._year -= 1;
        this._updateNewDate();
    }

    /**
     * Переход на предыдущий месяц и перерендер элементов
     */
    private _prevMonth() {
        this._movePreviousMonth();
        this._reRender();
    }

    /**
     * Переход на следующий месяц
     * @returns следующий год
     */
    private _moveNextMonth() {
        if (this._monthNumber === 12) {
            return this._moveNextYear();
        }

        this._monthNumber = this._monthNumber + 1;
        this._updateNewDate();
    }

    /**
     * Переход на следующий год
     */
    private _moveNextYear() {
        this._monthNumber = 1;
        this._year += 1;
        this._updateNewDate();
    }

    /**
     * Переход на следующий месяц и перерендер элементов
     */
    private _nextMonth() {
        this._moveNextMonth();
        this._reRender();
    }

    /**
     * Перерендер элементов
     */
    private _reRender() {
        this._updateHeader();
        this._getDates();
    }

    /**
     * Получаем массив с ифнормацией о днях в месяце
     * @returns массив с днями месяца
     */
    private _getMonthDays() {
        const firstDay = this._getDay(0);
        // const prevMonth = this._getPreviousMonth();
        const weekDays = firstDay.dayNumber - 1;
        const allDays = this._getDaysInMonth() + weekDays;

        let monthList: any = Array.from({ length: allDays });

        for (let i = weekDays; i < allDays; i++) {
            monthList[i] = this._getDay(i + 1 - weekDays);
        }

        // for (let i = 0; i < weekDays; i++) {
        // 	monthList[i] = this._getDay(this._getDaysInMonth() - 1);
        // }

        return monthList;
    }

    /**
     * Получаем названия недель в DOM
     * @returns HTML element
     */
    private _getWeeks() {
        this._Week = document.createElement('div');
        let week = this._Week;
        week.classList.add('dp-datepicker-calendar-weeks');
        this._weeks.forEach((elem) => {
            let weekDay = document.createElement('p');
            weekDay.classList.add('dp-datepicker-calendar-week');
            weekDay.innerHTML = elem;

            week.append(weekDay);
        });
        return week;
    }

    /**
     * Получаем набор из 12 месяцев в году
     * @param lang - язык
     * @returns месяца
     */
    private _getMonths(lang = 'default') {
        if (!this._Months) {
            this._Months = document.createElement('div');
        }

        let months = this._Months;
        months.innerHTML = '';

        months.classList.add('dp-datepicker-months');

        for (let i = 0; i < 12; i++) {
            let month = document.createElement('button');
            month.classList.add('dp-datepicker-month-btn');

            let date = new Date(this._year, i);
            month.innerHTML = date.toLocaleString(lang, { month: 'short' });
            month.setAttribute('data-id', `${i}`);

            let activeIf = this._selectedMonth === i + 1 && this._selectedYear === this._year;

            if (activeIf) {
                month.classList.add('dp-datepicker-current-active');
            } else {
                month.classList.remove('dp-datepicker-current-active');
            }

            if (this._maxMonth) {
                let maxMonthIf = i + 1 > this._maxMonth && this._year === this._maxYear;
                if (maxMonthIf) month.style.display = 'none';
            }

            if (this._minMonth) {
                let minMonthIf = i + 1 < this._minMonth && this._year === this._minYear;
                if (minMonthIf) month.style.display = 'none';
            }

            month.addEventListener('mousedown', (event) => this._clickOnMonth(event));

            months.append(month);
        }
        return months;
    }

    /**
     * Событие при клики на один из 12 месяцев в наборе
     * @param event - событие
     */
    private _clickOnMonth(event: Event) {
        event.preventDefault();
        let target = event.target as HTMLButtonElement;
        let number = target.dataset.id;
        if (number) this._monthNumber = +number + 1;
        this._depth = 0;
        this._updateNewDate();
        this._getDates();
        this._closeAllMonths();
        this._updateHeader();
    }

    /**
     * Открытие вкладки с набором 12 месяцев
     */
    private _openAllMonths() {
        let months = this._Months;
        if (this._isAnimation) {
            months?.classList.add('dp-datepicker-open');
            months?.classList.remove('dp-datepicker-close');
        } else {
            months?.classList.add('dp-datepicker-close-anim');
        }

        this._updateHeader();

        if (this._MonthButton) this._MonthButton.innerHTML = `${this._year}`;
    }

    /**
     * Закрытие вкладки с набором 12 месяцев
     */
    private _closeAllMonths() {
        let months = this._Months;
        if (this._isAnimation) {
            months?.classList.remove('dp-datepicker-open');
            months?.classList.add('dp-datepicker-close');
            setTimeout(() => {
                months?.classList.remove('dp-datepicker-close');
            }, 280);
        } else {
            months?.classList.remove('dp-datepicker-close-anim');
        }

        let name = this._month.charAt(0).toUpperCase() + this._month.slice(1);
        if (this._MonthButton) this._MonthButton.innerHTML = `${name} ${this._year}`;
    }

    /**
     * Получаем набор годов в десятилетии
     * @returns HTML element
     */
    private _getYears() {
        if (!this._Years) {
            this._Years = document.createElement('div');
        }

        let years = this._Years;
        years.innerHTML = '';
        years.classList.add('dp-datepicker-years');

        for (let i = 0; i < 12; i++) {
            let year = document.createElement('button');
            year.classList.add('dp-datepicker-year-btn');

            let prev = this._year;
            let prevNumber = ('' + prev).split('').slice(0, 3);
            prev = +(prevNumber.join('') + '0');

            let yearDate = new Date(prev - 1 + i, i).getFullYear();

            if (yearDate > this.max.getFullYear()) {
                break;
            }

            if (yearDate < this.min.getFullYear()) {
                continue;
            }

            year.innerHTML = `${yearDate}`;
            year.setAttribute('data-id', `${i}`);

            if (yearDate === this._selectedYear) {
                year.classList.add('dp-datepicker-current-active');
            }

            year.addEventListener('mousedown', (event) => {
                this._clickOnYears(event);
            });

            years.append(year);
        }
        return years;
    }

    /**
     * Открываем набор годов в десятилетии
     */
    private _openYears() {
        let max = this.max.getFullYear();
        let min = this.min.getFullYear();
        if (this._isAnimation) {
            this._Years?.classList.remove('dp-datepicker-close');
            this._Years?.classList.add('dp-datepicker-open');
        } else {
            this._Years?.classList.add('dp-datepicker-close-anim');
        }

        let prev = this._year;
        let prevNumber = ('' + prev).split('').slice(0, 3);
        prev = +(prevNumber.join('') + '0');
        let last = prev + 9;

        if (last >= max) {
            last = max;
        }
        if (prev <= min) {
            prev = min;
        }

        this._updateHeader();

        if (this._MonthButton) this._MonthButton.innerHTML = `${prev}-${last}`;
    }

    /**
     * Закрываем набор годов в десятилетии
     */
    private _closeYears() {
        if (this._isAnimation) {
            this._Years?.classList.add('dp-datepicker-close');
            this._Years?.classList.remove('dp-datepicker-open');
            setTimeout(() => {
                this._Years?.classList.remove('dp-datepicker-close');
            }, 280);
        } else {
            this._Years?.classList.remove('dp-datepicker-close-anim');
        }
    }

    /**
     * Событие при клике на один из годов в наборе
     * @param event - событие
     */
    private _clickOnYears(event: Event) {
        event.preventDefault();
        let target = event.target as HTMLButtonElement;
        this._year = +target.innerHTML;
        this._depth = 1;
        this._closeYears();
        this._getMonths();
        this._openAllMonths();
    }

    /**
     * Получаем набор годов в столетии в DOM
     * @returns HTML element
     */
    private _getAllYears() {
        let max = this.max.getFullYear();
        let min = this.min.getFullYear();
        if (!this._AllYears) {
            this._AllYears = document.createElement('div');
        }

        let allYears = this._AllYears;
        allYears.innerHTML = '';
        allYears.classList.add('dp-datepicker-years');

        let value;
        if (this._year > 1999 && min < 1999) {
            value = 2000;
        } else {
            value = min;
        }

        for (let i = 0; i < 12; i++) {
            let yearBtn = document.createElement('button');
            yearBtn.classList.add('dp-datepicker-year-btn');
            let year = document.createElement('span');

            let result;
            if (value) {
                let num = value.toString().split('')[3];
                if (+num !== 0) {
                    let j = 10 - +num;
                    result = `${value}-${value + j - 1}`;
                    if (this._selectedYear >= value && this._selectedYear <= value + j - 1) {
                        yearBtn.classList.add('dp-datepicker-current-active');
                    }
                    value += j;
                } else {
                    result = `${value}-${value + 9}`;
                    if (this._selectedYear >= value && this._selectedYear <= value + 9) {
                        yearBtn.classList.add('dp-datepicker-current-active');
                    }
                    value += 10;
                }
                if (value > max) {
                    result = `${value - 10}-${max}`;
                }
            }

            if (value < min) continue;
            if (value > max + 10) break;
            if (value > 2000 && this._year < 2000) {
                break;
            }

            year.innerHTML = `${result}`;

            year.addEventListener('mousedown', (event) => this._clickOnAllYears(event));

            yearBtn.append(year);
            allYears.append(yearBtn);
        }
        return allYears;
    }

    /**
     * Событие при клике на одно из десятилетий
     * @param event - событие
     */
    private _clickOnAllYears(event: Event) {
        event.preventDefault();
        let target = event.target as HTMLButtonElement;
        let num = target.innerText;
        this._depth = 2;
        this._year = +num.split('-')[0];
        this._closeAllYears();
        this._getYears();
        this._openYears();
    }

    /**
     * Открываем набор годов столетия
     */
    private _openAllYears() {
        let max = this.max.getFullYear();
        let min = this.min.getFullYear();
        if (this._isAnimation) {
            this._AllYears?.classList.remove('dp-datepicker-close');
            this._AllYears?.classList.add('dp-datepicker-open');
        } else {
            this._AllYears?.classList.add('dp-datepicker-close-anim');
        }

        let prev = 0;
        let last = 0;

        if (this._year > 1999) {
            prev = 2000;
            last = max;
        } else {
            prev = min;
            last = 1999;
        }

        if (min !== 1900 && min > 1999) {
            prev = min;
        }
        this._updateHeader();

        if (this._MonthButton) this._MonthButton.innerHTML = `${prev}-${last}`;
    }

    /**
     * Закрываем набор годов столетия
     */
    private _closeAllYears() {
        if (this._isAnimation) {
            this._AllYears?.classList.remove('dp-datepicker-open');
            this._AllYears?.classList.add('dp-datepicker-close');
            setTimeout(() => {
                this._AllYears?.classList.remove('dp-datepicker-close');
            }, 280);
        } else {
            this._AllYears?.classList.remove('dp-datepicker-close-anim');
        }
    }

    /**
     * Получаем даты календаря и дни недели
     * @returns HTMLElement с датами и днями недели
     */
    private _getDates() {
        if (!this._Dates) {
            this._Dates = document.createElement('div');
        }
        let dates = this._Dates;
        dates.innerHTML = '';
        dates.classList.add('dp-datepicker-calendar-dates');

        let weeks = document.createElement('div');
        weeks.append(this._getWeeks());

        let days = document.createElement('div');
        days.classList.add('dp-datepicker-calendar-days');

        let monthDays = this._getMonthDays();

        days.append(this._getMonths(), this._getYears(), this._getAllYears());
        dates.append(weeks, days);

        monthDays.forEach((elem: { date: string; }) => {
            let date = document.createElement('button');
            date.classList.add('dp-datepicker-calendar-day');
            if (elem) {
                if (this._year === this._maxYear && this._monthNumber === this._maxMonth) {
                    if (this._maxDay) {
                        let maxDateIf = parseInt(elem.date) > this._maxDay;

                        maxDateIf ? (date.textContent = null) : (date.textContent = elem.date);
                    }
                } else {
                    if (this._minDay) {
                        let minDateIf =
                            this._year === this._minYear &&
                            this._monthNumber === this._minMonth &&
                            parseInt(elem.date) < this._minDay;

                        minDateIf ? (date.textContent = null) : (date.textContent = elem.date);
                    }
                }

                if (!this._maxDay && !this._minDay) {
                    date.textContent = elem.date;
                }

                let selectDateIf =
                    this._monthNumber === this._selectedMonth &&
                    this._year === this._selectedYear &&
                    `${elem.date}` === `${this._date}`;

                if (selectDateIf) {
                    date.classList.add('dp-datepicker-current-active');
                }
            }

            if (!date.textContent) {
                date.setAttribute('disabled', 'true');
                date.style.visibility = 'hidden';
            }

            date.addEventListener('mousedown', (event) => {
                this._clickOnDate(event);
                this._createNewEvent(event);
            });
            days?.append(date);
        });

        return dates;
    }

    /**
     * Событие при клике на определнную дату
     * @param event - событие
     */
    private _clickOnDate(event: Event) {
        event.preventDefault();
        let target = event.target as HTMLButtonElement;
        this._date = +target?.innerHTML;
        this.value = this._getNewDate(this._replaceFormat(this.dateFormat));

        let days = document.querySelectorAll('.dp-datepicker-calendar-day');
        days.forEach((day) => {
            day.classList.remove('dp-datepicker-current-active');
        });
        target.classList.add('dp-datepicker-current-active');

        this._Control?.classList.add('dp-datepicker-control-active');
        this._Control?.classList.remove('dp-datepicker-control-error');

        if (this._isBack) {
            this._DatePicker?.classList.remove('dp-datepicker-background');
        }

        this._closeCalendar();
        this._updateSelectedDay();
        this._getDates();
    }

    /** Обновляем header при переключении между вкладками */
    private _updateHeader() {
        let max = this.max.getFullYear();
        let min = this.min.getFullYear();
        if (this._depth === 1) {
            this._titleValue = `${this._year}`;
            if (this._year === min && this._year === max) {
                this._setPrevAttr();
                this._setNextAttr();
            } else if (this._year === min) {
                this._setPrevAttr();
                this._removeNextAttr();
            } else if (this._year === max) {
                this._setNextAttr();
                this._removePrevAttr();
            } else {
                this._removePrevAttr();
                this._removeNextAttr();
            }
        } else if (this._depth === 0) {
            this._titleValue = `${this._month} ${this._year}`;

            let maxYearIf =
                (this._year === this._maxYear && this._monthNumber === this._maxMonth) ||
                (this._year === this._maxYear && this._monthNumber === 12);
            let minYearIf =
                (this._year === this._minYear && this._monthNumber === this._minMonth) ||
                (this._year === this._minYear && this._monthNumber === 1);

            if (maxYearIf) {
                this._setNextAttr();
                this._removePrevAttr();
            } else if (minYearIf) {
                this._setPrevAttr();
                this._removeNextAttr();
            } else {
                this._removePrevAttr();
                this._removeNextAttr();
            }
        } else if (this._depth === 3) {
            if (this._year < 1999) {
                this._titleValue = `${min}-${1999}`;
                this._setPrevAttr();
                this._removeNextAttr();
            } else {
                this._setPrevAttr();
            }

            if (this._year > 1999 && min < 1999) {
                this._titleValue = `${2000}-${max}`;
                this._setNextAttr();
                this._removePrevAttr();
            } else if (min > 1999) {
                this._titleValue = `${min}-${max}`;
                this._setNextAttr();
            }
        } else {
            let prev = this._year;
            let prevNumber = ('' + prev).split('').slice(0, 3);
            prev = +(prevNumber.join('') + '0');
            let last = prev + 9;

            if (last >= max) {
                last = max;
                this._setNextAttr();
            } else {
                this._removeNextAttr();
            }
            if (prev <= min) {
                prev = min;
                this._setPrevAttr();
            } else {
                this._removePrevAttr();
            }

            this._titleValue = `${prev}-${last}`;
        }

        let name = this._titleValue.charAt(0).toUpperCase() + this._titleValue.slice(1);

        if (this._MonthButton) this._MonthButton.textContent = name;
    }

    /** Устанавливаем disabled для кнопки вперед */
    private _setNextAttr() {
        this._NextButton?.setAttribute('disabled', 'true');
    }

    /** Удаляем disabled для кнопки вперед */
    private _removeNextAttr() {
        this._NextButton?.removeAttribute('disabled');
    }

    /** Устанавливаем disabled для кнопки назад */
    private _setPrevAttr() {
        this._PrevButton?.setAttribute('disabled', 'true');
    }

    /** Удаляем disabled для кнопки назад */
    private _removePrevAttr() {
        this._PrevButton?.removeAttribute('disabled');
    }

    /**
     * Получаем футер с иконкой и выбранной датой в DOM
     * @returns HTMLElement с иконкой и выбранной датой
     */
    private _getFooter() {
        let footer = document.createElement('div');
        footer.classList.add('dp-datepicker-footer');

        this._CurrentDay = document.createElement('button');
        let currentDay = this._CurrentDay;
        currentDay.classList.add('dp-datepicker-current-day');
        this._day = this._day.charAt(0).toUpperCase() + this._day.slice(1);
        currentDay.innerHTML = `${this._day}, ${this._date} ${this._month}, ${this._year} `;

        let iconToday = document.createElement('button');
        iconToday.classList.add('dp-datepicker-today');

        iconToday.insertAdjacentHTML(
            'afterbegin',
            '<svg class="dp-datepicker-icon"><use xlink:href="' + DPElements.IconPath + 'today"></use></svg>'
        );

        iconToday.addEventListener('mousedown', (event) => {
            event.preventDefault();
            if (new Date() < this.max) {
                this.value = new Date();
                this._createNewEvent(event);
            }
        });

        footer.append(currentDay, iconToday);
        return footer;
    }

    /**
     * Обновляем данные на основе выбранной даты
     * @param date - Выбранная Дата
     * @param lang - язык
     */
    private _updateCurrentDate(date: Date | null = null, lang: string = 'default') {
        date = date ?? new Date();
        this._dayNumber = date.getDay() + 1;
        this._day = date.toLocaleString(lang, { weekday: 'long' });
        this._month = date.toLocaleString(lang, { month: 'long' });
        this._date = date.getDate();
        this._monthNumber = date.getMonth() + 1;
        this._year = date.getFullYear();

        if (date < this.max) {
            this._hours = date.getHours();
            this._minutes = date.getMinutes();
            this._seconds = date.getSeconds();

            this._updateSelectedTime(this._hours, this._minutes, this._seconds);
        }

        this._updateSelectedDay();

        if (this._isOpen) {
            this._closeCalendar();
        }

        if (this._depth > 0) {
            this._closeYears();
            this._closeAllMonths();
            this._closeAllYears();
        }

        this._depth = 0;

        if (this._isBack) {
            this._DatePicker?.classList.remove('dp-datepicker-background');
        }

        this._Control?.classList.remove('dp-datepicker-control-error');

        this._day = this._day.charAt(0).toUpperCase() + this._day.slice(1);
        if (this._CurrentDay)
            this._CurrentDay.innerHTML = `${this._day}, ${this._date} ${this._month}, ${this._year} `;

        this._titleValue = `${this._month} ${this._year}`;

        if (this._MonthButton)
            this._MonthButton.innerHTML =
                this._titleValue.charAt(0).toUpperCase() + this._titleValue.slice(1);

        if (this._Dates) {
            this._getDates();
        }
    }

    /**
     * Устанавливает формат даты
     * @param value - формат например: 'MM.DD.YYYY'
     */
    private _setFormat(value: string) {
        this._format = value;
        this._dateFormat = value;
        if (this._Input) {
            if (this.value) {
                this.value = this._getNewDate(this._replaceFormat(this.dateFormat));
            }
        }
    }

    /**
     * Устанавливает минимально доступную дату
     * @param value - минимальный год или 0 - сегодня макс.
     */
    private _setMin(value: Date | string) {
        if (typeof value === 'string') value = new Date(value);
        if (typeof value === 'object') {
            if (!isNaN(Date.parse(value.toString()))) {
                this._min = new Date(value);
            }
            this._minYear = this._min.getFullYear();
            this._minMonth = this._min.getMonth() + 1;
            this._minDay = this._min.getDate();
        }
    }

    /**
     * Устанавливает максимально доступную дату
     * @param value - максимальный год или 0 - сегодня макс.
     */
    private _setMax(value: Date | string | boolean) {
        if (typeof value === 'string') value = DPElements.Global.CheckDate(value);
        if (typeof value === 'object') {
            if (!isNaN(Date.parse(value.toString()))) {
                let date = new Date(value);
                let day = date.getDate();
                let month = date.getMonth() + 1;
                let year = date.getFullYear();

                if (this.maxTime) {
                    this._updateMaxTime(date);
                }
                this._max = date;

                if (this._maxDay === day && this._maxMonth === month && this._maxYear === year) {
                    this.value = this._getNewDate(this._replaceFormat(this.dateFormat));
                }
            }
            this._maxYear = this._max.getFullYear();
            this._maxMonth = this._max.getMonth() + 1;
            this._maxDay = this._max.getDate();
        }
    }

    /**
     * Обновляет максимально допустимое время на основе новой даты
     * @param date - дата
     */
    private _updateMaxTime(date: Date) {
        let hour = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        this._updateSelectedTime(hour, minutes, seconds);
        this._setMaxTime(true);
    }

    /**
     * Устанавливает максимально допустимое время
     * @param value - true - вкл
     */
    private _setMaxTime(value: boolean) {
        if (value) {
            this._maxTime = this._selectedTime;
            this._getTime(this.interval);
        } else {
            this._maxTime = '';
        }
    }

    /**
     * Запрещает редактирование даты или разрешает
     * @param value - true || false
     */
    private _setReadOnly(value: boolean) {
        this._readonly = value;
        if (this._Input) {
            this._Input.readOnly = value;
        }
    }

    /**
     * Включает или отключает отображение времени и всех его элементов
     * @param value - true || false
     */
    private _setTime(value: boolean) {
        if (value && !this._time) {
            if (this._Input?.value !== '') {
                this.innerHTML = '';
                this.append(this._getControl());
                if (this._value) {
                    this.value = this._getNewDate(this._replaceFormat(this.dateFormat));
                }
                this._setMaxLength();
                // this._setTimeFormat(this.timeFormat);
            }
        }
        if (!value) {
            this._Time?.remove();
            this._ClockButton?.remove();
            let isTime = this.dateFormat.split('').indexOf('m');
            if (this._Input && isTime != -1) {
                this.dateFormat = this.dateFormat.substring(
                    0,
                    this.dateFormat.length - this.timeFormat.length - 1
                );
                if (this.value) {
                    this.value = this._getNewDate(this._replaceFormat(this.dateFormat));
                }
            }
            this._Input?.setAttribute('maxlength', '10');
        }

        value ? (this._time = true) : (this._time = false);
    }

    /**
     * Включает или отключает секунды
     * @param value - true || false
     */
    private _setTimeFormat(value: string) {
        this._timeFormat = value;
        this._updateMaxTime(this.max);
    }

    /**
     * Устанавливаем заданный интервал по отображению времени
     * @param value - интервал времени, который необходимо установить
     */
    private _setInterval(value: string | number | null) {
        if (value) {
            this._interval = +value;
            if (!isNaN(this._interval)) {
                this._getTime(this._interval);
            } else {
                this._interval = 30;
            }
        }
    }

    /**
     * Включаем или отключаем анимацию
     * @param value true || false
     */
    private _setAnimation(value: boolean) {
        value ? (this._isAnimation = true) : (this._isAnimation = false);
    }

    private _setEnable(value: boolean) {
        this._disabled = value;
        this._enable = !value;
        if (this._Control) {
            if (value) {
                this._Input?.setAttribute('disabled', 'disabled');
                this._CalendarButton?.setAttribute('disabled', 'disabled');
                this._ClockButton?.setAttribute('disabled', 'disabled');

                this._Input?.classList.add('dp-datepicker-input-enable');
                this._Icons?.classList.add('dp-datepicker-icons-enable');
                this._CalendarButton?.classList.add('dp-datepicker-btn-enable');
                this._ClockButton?.classList.add('dp-datepicker-btn-enable');

                this._Control.classList.remove('dp-datepicker-control-hover');
                this._Control.classList.remove('dp-datepicker-control-act');
                this._Control.classList.remove('dp-datepicker-control-active');
            } else {
                this._Control.classList.add('dp-datepicker-control-hover');
                this._Control.classList.add('dp-datepicker-control-act');

                this._CalendarButton?.classList.remove('dp-datepicker-btn-enable');
                this._ClockButton?.classList.remove('dp-datepicker-btn-enable');
                this._Input?.classList.remove('dp-datepicker-input-enable');
                this._Icons?.classList.remove('dp-datepicker-icons-enable');

                this._Input?.removeAttribute('disabled');
                this._CalendarButton?.removeAttribute('disabled');
                this._ClockButton?.removeAttribute('disabled');
            }
        }
    }

    private _setValue(value: Date | string | boolean) {
        if (typeof value === 'string') {
            let newValue = new Date(value);
            if (isNaN(Date.parse(newValue.toString()))) {
                value = DPElements.Global.CheckDate(value);
            } else {
                value = newValue;
            }
        }
        if (typeof value === 'object') {
            if (!isNaN(Date.parse(value.toString()))) {
                this._value = value;
                this._nowDate = value;
                this._updateCurrentDate(value);
                if (value > this.max) {
                    this._hours = this.max.getHours();
                    this._minutes = this.max.getMinutes();
                    this._seconds = this.max.getSeconds();
                }
                if (this._Input) this._Input.value = this._replaceFormat(this.dateFormat);
            }
        } else if (!value) {
            this._value = '';
            if (this._Input) this._Input.value = '';
        } else {
            throw new Error('value - Дата имеет не правильный формат');
        }
    }

    // #region set and get

    set value(value: Date | string) {
        this._setProperty('value', value);
    }

    set max(value: Date) {
        this._setProperty('max', value);
    }

    set min(value: Date) {
        this._setProperty('min', value);
    }

    set enable(value: boolean) {
        this._setProperty('enable', `${value}`);
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', `${value}`);
    }

    set dateFormat(value: string) {
        this._setProperty('dateFormat', value);
    }

    set format(value: string) {
        this._setProperty('format', value);
    }

    set interval(value: number) {
        this._setProperty('interval', value);
    }

    set readonly(value: boolean) {
        this._setProperty('readonly', `${value}`);
    }

    set time(value: boolean) {
        this._setProperty('time', `${value}`);
    }

    set timeFormat(value: string) {
        this._setProperty('timeFormat', value);
    }

    set maxTime(value: boolean | string) {
        this._setProperty('maxTime', `${value}`);
    }

    set animation(value: boolean) {
        this._setProperty('animation', `${value}`);
    }

    get enable(): boolean {
        return this._enable;
    }

    get disabled(): boolean {
        return this._disabled;
    }

    get readonly(): boolean {
        return this._readonly;
    }

    get dateFormat(): string {
        return this._dateFormat;
    }

    get format(): string {
        return this._format;
    }

    get timeFormat(): string {
        return this._timeFormat;
    }

    get maxTime(): string {
        return this._maxTime;
    }

    get value(): Date | string {
        return this._value;
    }

    get max(): Date {
        return this._max;
    }

    get min(): Date {
        return this._min;
    }

    get time(): boolean {
        return this._time;
    }

    get interval(): number {
        return this._interval;
    }

    get isOpenTime(): boolean {
        return this._isOpenTime;
    }

    get isOpen(): boolean {
        return this._isOpen;
    }

    // #endregion set and get
});

customElements.define(
    "dataplat-number",
    class DataplatNumber extends HTMLElement {
        private _value: number | undefined | null;
        private _visualValueFocus: string;
        private _visualValueBlur: string;
        private _min: number;
        private _max: number;
        private _step: number;
        private _restrictDecimals: number;
        private _factor: number;
        private _format: string;
        private _text: string;
        private _placeholder: string;
        private _upArrowText: string;
        private _downArrowText: string;
        private _round: boolean;
        private _selectOnFocus: boolean;
        private _showArrows: boolean;
        private _readonly: boolean;
        private _disabled: boolean;
        private _arrowClickInterval: any;
        private _arrowClickTimeout: any;

        private _Spinner: HTMLSpanElement;
        private _Input: HTMLInputElement;
        private _UpArrow: HTMLButtonElement;
        private _DownArrow: HTMLButtonElement;

        public isRender: boolean = false;

        constructor() {
            super();

            this._visualValueFocus = "";
            this._visualValueBlur = "";
            this._min = -Infinity;
            this._max = Infinity;
            this._step = 1;
            this._restrictDecimals = 3;
            this._factor = 1;
            this._format = "number";
            this._text = "";
            this._placeholder = "";
            this._upArrowText = "";
            this._downArrowText = "";
            this._round = false;
            this._selectOnFocus = false;
            this._showArrows = true;
            this._readonly = false;
            this._disabled = false;
            this._arrowClickInterval;
            this._arrowClickTimeout;

            this._Spinner = document.createElement("span");
            this._Input = document.createElement("input");
            this._UpArrow = document.createElement("button");
            this._DownArrow = document.createElement("button");

            this.isRender = false;
        }

        connectedCallback() {
            this._checkIsRendered();
        }

        static get observedAttributes() {
            return [
                "value",
                "min",
                "max",
                "step",
                "decimal",
                "factor",
                "format",
                "text",
                "placeholder",
                "up-arrow-text",
                "down-arrow-text",
                "round",
                "select-on-focus",
                "show-arrows",
                "readonly",
                "disabled",
            ];
        }

        attributeChangedCallback(name: string, oldValue: string, newValue: string) {
            this._setProperty(name, newValue, oldValue);
        }

        /**
         * Обработка входящих значение
         * @param name  - Имя свойства
         * @param newValue  - Новое значение
         * @param oldValue  - Старое значение (Не обязательный параметр);
         */
        private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
            switch (name) {
                case "value":
                    this._setNewValue(newValue);
                    break;
                case "min":
                    this._setMin(Number(newValue));
                    break;
                case "max":
                    this._setMax(Number(newValue));
                    break;
                case "step":
                    this._setStep(Number(newValue));
                    break;
                case "decimal":
                    this._setDecimal(Number(newValue));
                    break;
                case "factor":
                    this._setFactor(Number(newValue));
                    break;
                case "format":
                    this._setFormat(newValue);
                    break;
                case "text":
                    this._setText(newValue);
                    break;
                case "placeholder":
                    this._setPlaceholder(newValue);
                    break;
                case "up-arrow-text":
                    this._setUpArrowText(newValue);
                    break;
                case "down-arrow-text":
                    this._setDownArrowText(newValue);
                    break;
                case "round":
                    this._setRound(newValue);
                    break;
                case "select-on-focus":
                    this._setSelectOnFocus(newValue);
                    break;
                case "show-arrows":
                    this._setShowArrows(newValue);
                    break;
                case "readonly":
                    this._setReadonly(newValue);
                    break;
                case "disabled":
                    this._setDisabled(newValue);
                default:
                    return;
            }
        }

        /**
         * @private проверка перед рендером
         * нужна для избежания повторных рендеров компонента по той или иной ситуации
         */
        private _checkIsRendered() {
            if (!this.isRender) {
                this._render();
                this.isRender = true;
            }
        }

        /**
         * @private рендер аккордеона
         */
        private _render() {
            this.CheckProperties();
            this._setInput();
            this._setSpinner();

            this.append(this._Input, this._Spinner);
            this.classList.add("dp-number");

            this._addEventListeners();
        }

        /**
         * @private получаем значения атрибутов и защищаем геттеры/сеттеры
         */
        private CheckProperties() {
            DPElements.Global.CheckProperty(this, "value");
            DPElements.Global.CheckProperty(this, "min");
            DPElements.Global.CheckProperty(this, "max");
            DPElements.Global.CheckProperty(this, "step");
            DPElements.Global.CheckProperty(this, "factor");
            DPElements.Global.CheckProperty(this, "restrict-decimals");
            DPElements.Global.CheckProperty(this, "format");
            DPElements.Global.CheckProperty(this, "placeholder");
            DPElements.Global.CheckProperty(this, "down-arrow-text");
            DPElements.Global.CheckProperty(this, "up-arrow-text");
            DPElements.Global.CheckProperty(this, "round");
            DPElements.Global.CheckProperty(this, "text");
            DPElements.Global.CheckProperty(this, "select-on-focus");
            DPElements.Global.CheckProperty(this, "show-arrows");
            DPElements.Global.CheckProperty(this, "readonly");
            DPElements.Global.CheckProperty(this, "disabled");
        }

        /**
         * @private создаем контейнер для кнопок
         * @returns спиннер с кнопками увеличения и уменьшения значения
         */
        private _setSpinner() {
            this._setArrows();
            this._Spinner.classList.add("dp-number-spinner");
            this._Spinner.dataset.visible = `${this._showArrows}`;
            this.dataset.arrows = `${this._showArrows}`;
            this._Spinner.append(this._UpArrow, this._DownArrow);
        }

        /**
         * @private готовим инпут
         */
        private _setInput() {
            this._Input.classList.add("dp-number-input");
            this._Input.setAttribute("type", "text");
            this._Input.setAttribute("title", this._text);

            if (this._readonly) {
                this._Input.setAttribute("readonly", `${this._readonly}`);
            }

            if (this._disabled) {
                this._Input.setAttribute("disabled", `${this._disabled}`);
            }

            this._setValue(this._value);
            this._setVisualValue();
            this._setInputValue();
        }

        /**
         *@private задаем атрибут title для инпута
         */
        private _setInputTitle() {
            this._Input.setAttribute("title", this._text);
        }

        /**
         * @private установка начального значения _value компонента
         */
        private _setValue(value: number | undefined | null) {
            if (!value && value !== 0) {
                this._value = null;

                return;
            }

            if (value > this._max) {
                this._value = this._max;
            } else if (value < this._min) {
                this._value = this._min;
            } else {
                if (this._restrictDecimals === 0) {
                    if (this._round) {
                        this._value = Math.round(value);
                    } else {
                        this._value = Math.trunc(value);
                    }
                } else if (this._restrictDecimals <= 20 && this._restrictDecimals >= 1) {
                    if (this._round) {
                        this._value = Number(value.toFixed(this._restrictDecimals));
                    } else {
                        const numberOfRestrictDecimals = Math.pow(10, this._restrictDecimals);
                        this._value =
                            Math.trunc(value * numberOfRestrictDecimals) / numberOfRestrictDecimals;
                    }
                }
            }
        }

        /**
         * @private рассчитываем отображаемое значение
         */
        private _setVisualValue() {
            if (!this._value && this._value !== 0) {
                this._visualValueFocus = "";
                this._visualValueBlur = "";

                return;
            }

            const visualValue = this._value * this._factor;
            this._visualValueFocus = visualValue.toString();

            let visualValueString = visualValue.toString();
            let result;

            if (visualValueString.includes(".")) {
                let integerString = visualValueString.split(".")[0];
                const decimalString = visualValueString.split(".")[1];

                if (integerString.length > 3) {
                    result = integerString.split(/(?=(?:\d{3})+$)/);
                    integerString = result.join(",");
                }

                visualValueString = `${integerString}.${decimalString}`;
            } else {
                if (visualValueString.length > 3) {
                    result = visualValueString.split(/(?=(?:\d{3})+$)/);
                    visualValueString = result.join(",");
                }
            }

            switch (this._format) {
                case "number":
                    this._visualValueBlur = visualValueString;
                    break;
                case "percent":
                    this._visualValueBlur = `${visualValueString} %`;
                    break;
                case "currency":
                    this._visualValueBlur = `₽ ${visualValueString}`;
                    break;
            }
        }

        _setInputValue() {
            if (document.activeElement === this._Input) {
                this._Input.value = this._visualValueFocus;
            } else {
                this._Input.value = this._visualValueBlur;
            }
        }

        /**
         * @private готовим кнопки увеличения и уменьшения значения
         */
        private _setArrows() {
            this._UpArrow.classList.add("dp-number-up");
            this._DownArrow.classList.add("dp-number-down");
            this._UpArrow.setAttribute("title", this._upArrowText);
            this._DownArrow.setAttribute("title", this._downArrowText);
        }

        /**
         * @private установка слушателей событий
         */
        private _addEventListeners() {
            this.addEventListener("pointerdown", (e: PointerEvent) => this._handlePointerDown(e));
            this.addEventListener("pointerup", () => this._handlePointerUp());
            this.addEventListener("focus", () => this._handleFocus());
            this._Input.addEventListener("input", () => this._handleInput());
            this._Input.addEventListener("keydown", (e: KeyboardEvent) => this._handleKeyClick(e));
            this._Input.addEventListener("focus", () => this._handleInputFocus());
            this._Input.addEventListener("blur", (e: FocusEvent) => this._handleInputBlur(e));
        }

        /**
         * @private начинаем увеличивать/уменьшать значение, пока лкм нажата
         * @param e PointerEvent
         */
        private _handlePointerDown(e: PointerEvent) {
            if (this._disabled) {
                return;
            }

            if (this._readonly) {
                return;
            }

            const target = e.target;
            if (target === this._UpArrow) {
                this._handleUpArrowClick(e);
                this._arrowClickTimeout = setTimeout(() => {
                    this._arrowClickInterval = setInterval(() => this._handleUpArrowClick(e), 100);
                }, 500);
            } else if (target === this._DownArrow) {
                this._handleDownArrowClick(e);
                this._arrowClickTimeout = setTimeout(() => {
                    this._arrowClickInterval = setInterval(
                        () => this._handleDownArrowClick(e),
                        100
                    );
                }, 500);
            }
        }

        /**
         * @private перестаем увеличивать/уменьшать значение, когда лкм отжата
         */
        private _handlePointerUp() {
            clearTimeout(this._arrowClickTimeout);
            clearInterval(this._arrowClickInterval);
        }

        /**
         * @private при фокусе на компоненте фокусируемся на инпуте
         */
        private _handleFocus() {
            this._Input.focus();
        }

        /**
         * @private запрет на ввод букв
         */
        private _handleInput() {
            if (this._disabled) {
                return;
            }

            if (this._readonly) {
                return;
            }

            this._Input.value = this._Input.value
                .replace(/[^0-9.-]/g, "")
                .replace(/(\..*)\./g, "$1");
        }

        /**
         * @private обработка клика по Enter
         * @param e KeyboardEvent
         */
        private _handleKeyClick(e: KeyboardEvent) {
            if (this._disabled) {
                return;
            }

            if (this._readonly) {
                return;
            }

            if (e.key === ",") {
                e.preventDefault();

                if (!this._Input.value.includes(".")) {
                    this._Input.value += ".";
                }
            }

            if (e.key === "-") {
                const target = e.target as HTMLInputElement;

                if (target.selectionStart !== 0 || this._Input.value.includes("-")) {
                    e.preventDefault();
                }
            }

            if (e.key === "Enter") {
                this.value = Number(this._Input.value) / this._factor;
                this._dispatchChangedEvent();
            } else if (
                e.key > "9" &&
                e.key !== "." &&
                e.key !== "," &&
                e.key !== "Escape" &&
                e.key !== "Backspace" &&
                e.key !== "Delete" &&
                e.key !== "Home" &&
                e.key !== "End"
            ) {
                this._handleInvalidInput();
            }
        }

        private _handleInvalidInput() {
            this.dataset.valid = "false";
            setTimeout(() => (this.dataset.valid = "true"), 100);
        }

        /**
         * @private обработка клика по стрелке вверх
         * @param e - MouseEvent
         */
        private _handleUpArrowClick(e: MouseEvent) {
            this.value = (this.value ?? 0) + this._step;
            this._dispatchChangedEvent();
        }

        /**
         * @private обработка клика по стрелке вниз
         * @param e - MouseEvent
         */
        private _handleDownArrowClick(e: MouseEvent) {
            this.value = (this.value ?? 0) - this._step;
            this._dispatchChangedEvent();
        }

        /**
         * @private создаем событие changed
         */
        private _dispatchChangedEvent() {
            const eventChanged = new Event("changed", {
                bubbles: true,
            });

            this.dispatchEvent(eventChanged);
        }

        /**
         * @private обработка фокуса на инпуте
         */
        private _handleInputFocus() {
            this._Input.value = this._visualValueFocus;

            if (this._selectOnFocus) {
                this._Input.select();
            }
        }

        /**
         * @private обработка blur на инпуте
         */
        private _handleInputBlur(e: FocusEvent) {
            const inputValue = this._Input.value !== '' ? Number(this._Input.value) : '';

            if (inputValue === '') {
                this.value = null;

                this._dispatchChangedEvent();

                return;
            }

            if (this._value !== inputValue / this._factor) {
                this.value = inputValue / this._factor;
                this._dispatchChangedEvent();
            } else {
                this._Input.value = this._visualValueBlur;
            }
        }

        /**
         * @private устанавливаем новое значение компонента
         * @param value - новое значение компонента
         */
        private _setNewValue(value: number | string | null | undefined) {
            const oldValue = this._value;
            let newValue;

            if (value || value === 0 || value === "0") {
                if (value.toString().includes(",")) {
                    newValue = Number(value.toString().replace(/[,]/g, "."));
                } else {
                    newValue = Number(value);
                }

                if (newValue === oldValue) {
                    return;
                } else if (newValue > this._max) {
                    this.value = this._max;
                } else if (newValue < this._min) {
                    this.value = this._min;
                }
            }

            this._setValue(newValue);
            this._setVisualValue();
            this._setInputValue();
        }

        /**
         * @private устанавливаем новое минимальное значение компонента
         * @param newValue - number новое значение
         */
        private _setMin(newValue: number) {
            const oldValue = this._min;

            if (newValue === oldValue) {
                return;
            }

            this._min = newValue;

            if (this._value && this._value < this._min) {
                this._value = this._min;
                this._setVisualValue();
                this._setInputValue();
            }
        }

        /**
         * @private устанавливаем новое минимальное значение компонента
         * @param newValue - number новое значение
         */
        private _setMax(newValue: number) {
            const oldValue = this._max;

            if (newValue === oldValue) {
                return;
            }

            this._max = newValue;

            if (this._value && this._value > this._max) {
                this._value = this._max;
                this._setVisualValue();
                this._setInputValue();
            }
        }

        /**
         * @private устанавливаем новое минимальное значение компонента
         * @param newValue - number новое значение
         */
        private _setStep(newValue: number) {
            const oldValue = this._step;

            if (newValue === oldValue) {
                return;
            }

            this._step = newValue;
        }

        /**
         * @private установка нового значения количества знаков после запятой
         * @param newValue - number новое значение
         */
        private _setDecimal(newValue: number) {
            const oldValue = this._restrictDecimals;

            if (newValue === oldValue) {
                return;
            }

            this._restrictDecimals = Math.floor(newValue);
        }

        /**
         * @private установка нового значения фактора
         * @param newValue - number новое значение
         */
        private _setFactor(newValue: number) {
            const oldValue = this._factor;

            if (newValue === oldValue) {
                return;
            }

            this._factor = newValue;
            this._setVisualValue();
        }

        /**
         * @private установка нового значения формата отображаемого значения
         * @param newValue - string новое значение
         */
        private _setFormat(newValue: string) {
            const oldValue = this._format;

            if (newValue === oldValue) {
                return;
            }

            this._format = newValue;
            this._setVisualValue();
        }

        /**
         * @private установка нового значения текста при наведении на компонент
         * @param newValue - string новое значение
         */
        private _setText(newValue: string) {
            const oldValue = this._text;

            if (newValue === oldValue) {
                return;
            }

            this._text = newValue;
            this._setInputTitle();
        }

        /**
         * @private установка нового значения плэйсхолдера инпута
         * @param newValue - string новое значение
         */
        private _setPlaceholder(newValue: string) {
            const oldValue = this._placeholder;

            if (newValue === oldValue) {
                return;
            }

            this._placeholder = newValue;
            this._Input.setAttribute("placeholder", this._placeholder);
        }

        /**
         * @private установка нового значения тайтла кнопки вверх
         * @param newValue - string новое значение
         */
        private _setUpArrowText(newValue: string) {
            const oldValue = this._upArrowText;

            if (newValue === oldValue) {
                return;
            }

            this._upArrowText = newValue;
            this._UpArrow.setAttribute("title", this._upArrowText);
        }

        /**
         * @private установка нового значения тайтла кнопки вниз
         * @param newValue - string новое значение
         */
        private _setDownArrowText(newValue: string) {
            const oldValue = this._downArrowText;

            if (newValue === oldValue) {
                return;
            }

            this._downArrowText = newValue;
            this._DownArrow.setAttribute("title", this._downArrowText);
        }

        /**
         * @private установка нового значения округления дробей
         * @param newValue - boolean новое значение
         */
        private _setRound(newValue: boolean) {
            if (typeof newValue === "boolean") {
                const oldValue = this._round;

                if (newValue === oldValue) {
                    return;
                }

                this._round = newValue;
                this._setValue(this._value);
            } else {
                this._setRound(newValue === "true" ? true : false);
            }
        }

        /**
         * @private установка нового значения выделения значения при фокусе на инпуте
         * @param newValue - boolean новое значение
         */
        private _setSelectOnFocus(newValue: boolean) {
            if (typeof newValue === "boolean") {
                const oldValue = this._selectOnFocus;

                if (newValue === oldValue) {
                    return;
                }

                this._selectOnFocus = newValue;
            } else {
                this._setSelectOnFocus(newValue === "true" ? true : false);
            }
        }

        /**
         * @private установка нового значения отображения стрелок
         * @param newValue - boolean новое значение
         */
        private _setShowArrows(newValue: boolean) {
            if (typeof newValue === "boolean") {
                const oldValue = this._showArrows;

                if (newValue === oldValue) {
                    return;
                }

                this._showArrows = newValue;

                this._Spinner.dataset.visible = `${this._showArrows}`;
                this.dataset.arrows = `${this._showArrows}`;
            } else {
                this._setShowArrows(newValue === "true" ? true : false);
            }
        }

        /**
         * @private установка нового значения отображения стрелок
         * @param newValue - boolean новое значение
         */
        private _setReadonly(newValue: boolean) {
            if (typeof newValue === "boolean") {
                const oldValue = this._readonly;

                if (newValue === oldValue) {
                    return;
                }

                this._readonly = newValue;

                if (this._readonly) {
                    this._Input.setAttribute("readonly", `${this._readonly}`);
                } else {
                    this._Input.removeAttribute("readonly");
                }
            } else {
                this._setReadonly(newValue === "true" ? true : false);
            }
        }

        /**
         * @private установка нового значения disabled
         * @param newValue - boolean новое значение
         */
        private _setDisabled(newValue: boolean) {
            if (typeof newValue === "boolean") {
                const oldValue = this._disabled;

                if (newValue === oldValue) {
                    return;
                }

                this._disabled = newValue;

                if (this._disabled) {
                    this._Input.setAttribute("disabled", `${this._disabled}`);
                } else {
                    this._Input.removeAttribute("disabled");
                }
            } else {
                this._setDisabled(newValue === "true" ? true : false);
            }
        }

        //#region сеттеры и геттеры

        set value(value: number | string | null | undefined) {
            this._setProperty("value", value);
        }

        get value(): number | null | undefined {
            return this._value;
        }

        set min(min: number) {
            this._setProperty("min", `${min}`);
        }

        get min(): number {
            return this._min;
        }

        set max(max: number) {
            this._setProperty("max", `${max}`);
        }

        get max(): number {
            return this._max;
        }

        set step(step: number) {
            this._setProperty("step", `${step}`);
        }

        get step(): number {
            return this._step;
        }

        set restrictDecimals(restrictDecimals: number) {
            this._setProperty("restrict-decimals", `${restrictDecimals}`);
        }

        get restrictDecimals(): number {
            return this._restrictDecimals;
        }

        set factor(factor: number) {
            this._setProperty("factor", `${factor}`);
        }

        get factor(): number {
            return this._factor;
        }

        set format(format: string) {
            this._setProperty("format", format);
        }

        get format(): string {
            return this._format;
        }

        set text(text: string) {
            this._setProperty("text", text);
        }

        get text(): string {
            return this._text;
        }

        set placeholder(placeholder: string) {
            this._setProperty("placeholder", placeholder);
        }

        get placeholder(): string {
            return this._placeholder;
        }

        set upArrowText(upArrowText: string) {
            this._setProperty("up-arrow-text", upArrowText);
        }

        get upArrowText(): string {
            return this._upArrowText;
        }

        set downArrowText(downArrowText: string) {
            this._setProperty("down-arrow-text", downArrowText);
        }

        get downArrowText(): string {
            return this._downArrowText;
        }

        set round(round: boolean) {
            this._setProperty("round", `${round}`);
        }

        get round(): boolean {
            return this._round;
        }

        set selectOnFocus(selectOnFocus: boolean) {
            this._setProperty("select-on-focus", `${selectOnFocus}`);
        }

        get selectOnFocus(): boolean {
            return this._selectOnFocus;
        }

        set showArrows(showArrows: boolean) {
            this._setProperty("show-arrows", `${showArrows}`);
        }

        get showArrows(): boolean {
            return this._showArrows;
        }

        set readonly(readonly: boolean) {
            this._setProperty("readonly", `${readonly}`);
        }

        get readonly(): boolean {
            return this._readonly;
        }

        set disabled(disabled: boolean) {
            this._setProperty("disabled", `${disabled}`);
        }

        get disabled(): boolean {
            return this._disabled;
        }
        //#endregion
    }
);

customElements.define("dataplat-radio-button", class DataPlatRadioButton extends HTMLElement {
    private _title: string;
    private _name: string;
    private _disabled: boolean;
    private _icon: string;
    private _action: string;
    private _value: boolean;

    public isRender: boolean;

    private _Input: HTMLInputElement;
    private _Label: HTMLLabelElement;
    private _Span: HTMLSpanElement;

    constructor() {
        super();
        this._title = "";
        this._name = "";
        this._value = false;
        this._disabled = false;
        this._icon = "";
        this._action = "";
        this.isRender = false;

        this._Input = document.createElement("input");
        this._Label = document.createElement("label");
        this._Span = document.createElement("span");
    }

    connectedCallback() {
        this._checkIsRendered();
    }

    static get observedAttributes() {
        return ["value", "name", "title", "disabled", "icon", "action"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "value":
                this._setValue(newValue);
                break;
            case "title":
                this._setTitle(newValue);
                break;
            case "action":
                this._setAction(newValue);
                break;
            case "name":
                this._setName(newValue);
                break;
            case "disabled":
                this._setDisabled(newValue);
                break;
            case "icon":
                this._setIcon(newValue);
                break;
        }
    }

    /**
     * @private проверка перед рендером
     * нужна для избежания повторных рендеров компонента по той или иной ситуации
     */
    private _checkIsRendered() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private рендер компонента
     */
    private _render() {
        this.classList.add("dp-toogle");
        this.append(this._getLabel());
    }

    /**
     * @private получаем label
     * @return - this.Label
     */
    private _getLabel(): HTMLElement {
        this._Label.classList.add("dp-toogle");

        DPElements.Global.CheckProperty(this, "value");
        DPElements.Global.CheckProperty(this, "name");
        DPElements.Global.CheckProperty(this, "disabled");
        DPElements.Global.CheckProperty(this, "title");
        DPElements.Global.CheckProperty(this, "icon");
        DPElements.Global.CheckProperty(this, "action");

        this._Label.append(this._getInput());
        this._Label.append(this._getCheckBox());

        return this._Label;
    }

    /** @private Получаем радио инпут */
    private _getInput() {
        this._Input.classList.add("dp-toogle-input");
        this._Input.type = "radio";
        this._Input.name = this.name;
        this._Input.checked = this.value;
        this._Input.addEventListener("change", (e) => {
            this._checkChanged(e);
        });
        return this._Input;
    }

    /** @private Получаем элемент радио инпута */
    private _getCheckBox() {
        this._Span.classList.add("dp-toogle-check");

        return this._Span;
    }

    /**
     * @private диспатчим Event "changed" и "action" при изменении состояния checked у радио инпутов
     * @param event - Event
     */
    private _checkChanged(event: Event) {
        let target = event.target as HTMLInputElement;
        if (target) {
            this.value = target.checked;
        }

        let eventNew = new Event("changed", {
            bubbles: true,
        });
        this.dispatchEvent(eventNew);

        let eventAction = new Event(this._action, {
            bubbles: true,
        });
        this.dispatchEvent(eventAction);
    }

    /** @private Задаем имя элемента */
    private _setName(value: string) {
        if (value) {
            this._name = value;
            if (this._Input) {
                this._Input.name = value;
            }
        }
    }

    /** @private Задаем значение элемента  */
    private _setValue(value: boolean) {
        if (typeof value === "boolean") {
            this._value = value;
        } else {
            if (value === "true") {
                this._value = true;
            }
            if (value === "false") {
                this._value = false;
            }
        }
        if (this._Input) {
            if (this._Input.checked !== this._value) {
                this._Input.checked = this._value;
            }
        }
    }

    /** @private Задаем активность элемента */
    private _setDisabled(value: boolean) {
        if (typeof value === "boolean") {
            if (this._Input) {
                this._Input.disabled = value;
                this._disabled = value;
            }
        } else {
            if (value === "true") this._setDisabled(true);
            if (value === "false") this._setDisabled(false);
        }

        this.dispatchEvent(new Event('dptoggledisabled', { bubbles: true }));
    }

    /** @private Задаем текст при наведении */
    private _setTitle(value: string) {
        if (value) {
            if (value === null) value = "";
            this._title = value;

            if (this._Span) {
                this._Span.setAttribute("title", this._title);
            }
        }
    }

    /** @private Задаем действие, которое должно выполниться при клике */
    private _setAction(value: string) {
        if (value) {
            if (value === null) value = "";
            this._action = value;
        }
    }

    /**
     *
     * @param icon - string id иконки
     * @private назначаем иконку
     */
    private _setIcon = (icon: string): void => {
        this._Span.innerHTML = `<svg class="dp-icon-button-svg"><use href="${DPElements.IconPath}${icon}"></use></svg>`;
        this._icon = icon;
    };

    //#region геттеры и сеттеры
    get title(): string {
        return this._title;
    }

    set title(value: string) {
        this._setProperty("title", value);
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty("disabled", `${value}`);
    }

    get name() {
        return this._name;
    }

    set name(value: string) {
        this._setProperty("name", value);
    }

    get icon() {
        return this._icon;
    }

    set icon(value: string) {
        this._setProperty("icon", value);
    }

    get value(): boolean {
        return this._value;
    }

    set value(value: boolean) {
        this._setProperty("value", `${value}`);
    }

    get action(): string {
        return this._action;
    }

    set action(action: string) {
        this._setProperty("action", `${action}`);
    }
    //#endregion геттеры и сеттеры
}
);

customElements.define("dataplat-checkbox-button", class DataPlatCheckboxButton extends HTMLElement {
    private _title: string;
    private _disabled: boolean;
    private _icon: string;
    private _iconReplace: string;
    private _action: string;

    private _value: boolean;
    public isRender: boolean;

    private _Input: HTMLInputElement;
    private _Label: HTMLLabelElement;
    private _Span: HTMLSpanElement;
    private _Icon: SVGElement;
    private _IconReplace: SVGElement;

    constructor() {
        super();

        this._title = "";
        this._value = false;
        this._disabled = false;
        this._icon = "";
        this._iconReplace = "";
        this._action = "";
        this.isRender = false;
        this._Input = document.createElement("input");
        this._Label = document.createElement("label");
        this._Span = document.createElement("span");
        this._Icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._IconReplace = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    }

    connectedCallback() {
        this._checkIsRendered();
    }

    static get observedAttributes() {
        return ["value", "title", "disabled", "icon", "action", "iconReplace"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "value":
                this._setValue(newValue);
                break;
            case "title":
                this._setTitle(newValue);
                break;
            case "action":
                this._setAction(newValue);
                break;
            case "disabled":
                this._setDisabled(newValue);
                break;
            case "icon":
                this._setIcon(newValue);
                break;
            case "iconReplace":
                this._setIconReplace(newValue);
                break;
        }
    }

    /**
     * @private проверка перед рендером
     * нужна для избежания повторных рендеров компонента по той или иной ситуации
     */
    private _checkIsRendered() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private рендер компонента
     */
    private _render() {
        this.classList.add("dp-toogle");

        this.append(this._getLabel() as HTMLElement);

        if (!this._iconReplace) {
            return;
        }

        this._Span.append(this._IconReplace);

        if (this._value === true) {
            this._Icon!.dataset.visible = "false";
            this._IconReplace!.dataset.visible = "true";
        } else {
            this._Icon!.dataset.visible = "true";
            this._IconReplace!.dataset.visible = "false";
        }
    }

    /**
     * @private получаем label
     * @returns this.Label
     */
    private _getLabel(): HTMLElement {
        this._Label.classList.add("dp-toogle");
        DPElements.Global.CheckProperty(this, "value");
        DPElements.Global.CheckProperty(this, "disabled");
        DPElements.Global.CheckProperty(this, "title");
        DPElements.Global.CheckProperty(this, "icon");
        DPElements.Global.CheckProperty(this, "iconReplace");
        DPElements.Global.CheckProperty(this, "action");

        this._Label.append(this._getInput());
        this._Label.append(this._getCheckBox());

        return this._Label;
    }

    /** @private Получаем чекбокс */
    private _getInput() {
        this._Input.classList.add("dp-toogle-input");
        this._Input.type = "checkbox";
        this._Input.checked = this.value;
        this._Input.addEventListener("change", (e) => {
            this._checkChanged(e);
        });
        return this._Input;
    }

    /** @private Получаем элемент чекбокса */
    private _getCheckBox() {
        this._Span.classList.add("dp-toogle-check");

        this._Span.prepend(this._Icon);
        return this._Span;
    }

    /**
     * @private диспатчим Event "changed" и "action" при изменении состояния checked у радио инпутов
     * @param event - Event
     */
    private _checkChanged(event: Event) {
        let target = event.target as HTMLInputElement;
        if (target) {
            this.value = target.checked;
        }

        let eventChanged = new Event("changed", {
            bubbles: true,
        });
        this.dispatchEvent(eventChanged);

        let eventAction = new Event(this._action, {
            bubbles: true,
        });
        this.dispatchEvent(eventAction);

        if (!this._iconReplace) {
            return;
        }

        if (this._value === true) {
            this._Icon!.dataset.visible = "false";
            this._IconReplace!.dataset.visible = "true";
        } else {
            this._Icon!.dataset.visible = "true";
            this._IconReplace!.dataset.visible = "false";
        }
    }

    /** @private Задаем значение элемента  */
    private _setValue(value: boolean) {
        if (typeof value === "boolean") {
            this._value = value;
        } else {
            if (value === "true") {
                this._value = true;
            }
            if (value === "false") {
                this._value = false;
            }
        }
        if (this._Input) {
            if (this._Input.checked !== this._value) {
                this._Input.checked = this._value;
            }
        }
    }

    /** @private Задаем активноcть элемента */
    private _setDisabled(value: boolean) {
        if (typeof value === "boolean") {
            if (this._Input) {
                this._Input.disabled = value;
                this._disabled = value;
            }
        } else {
            if (value === "true") this._setDisabled(true);
            if (value === "false") this._setDisabled(false);
        }

        this.dispatchEvent(new Event('dptoggledisabled', { bubbles: true }));
    }

    /** @private Задаем текст при наведении */
    private _setTitle(value: string) {
        if (value) {
            if (value === null) value = "";
            this._title = value;

            if (this._Span) {
                this._Span.setAttribute("title", this._title);
            }
        }
    }

    /** @private Задаем действие, которое должно выполниться при клике */
    private _setAction(value: string) {
        if (value) {
            if (value === null) value = "";
            this._action = value;
        }
    }

    /**
     * @param icon - string id иконки
     *  @private назначаем иконку
     */
    private _setIcon = (icon: string): void => {
        this._Icon = this._createSpriteIcon(icon);
        this._icon = icon;
    };

    /**
     * @param icon - string id иконки
     *  @private назначаем подменную иконку
     */
    private _setIconReplace = (icon: string): void => {
        this._IconReplace.remove();

        if (icon === "") {
            return;
        }

        this._IconReplace = this._createSpriteIcon(icon);
        this._iconReplace = icon;

        this._Span.append(this._IconReplace);

        if (this._value === true) {
            this._Icon!.dataset.visible = "false";
            this._IconReplace!.dataset.visible = "true";
        } else {
            this._Icon!.dataset.visible = "true";
            this._IconReplace!.dataset.visible = "false";
        }
    };

    /**
     * @private - создаем иконку по id иконки в спрайте
     * @param iconPath - id иконки в спрайте
     */
    private _createSpriteIcon(iconPath: string) {
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

        use.setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            `${DPElements.IconPath}${iconPath}`
        );

        icon.classList.add("dp-icon-button-svg");
        icon.append(use);
        return icon;
    }

    //#region геттеры и сеттеры
    get title(): string {
        return this._title;
    }

    set title(value: string) {
        this._setProperty("title", value);
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty("disabled", `${value}`);
    }

    get icon() {
        return this._icon;
    }

    set icon(value: string) {
        this._setProperty("icon", value);
    }

    get iconReplace() {
        return this._iconReplace;
    }

    set iconReplace(value: string) {
        this._setProperty("iconReplace", value);
    }

    get value(): boolean {
        return this._value;
    }

    set value(value: boolean) {
        this._setProperty("value", `${value}`);
    }

    get action(): string {
        return this._action;
    }

    set action(value: string) {
        this._setProperty("action", `${value}`);
    }
    //#endregion
}
);

customElements.define("dataplat-toolbar", class DataplatToolbar extends HTMLElement {
    private _toolbarWidth: number;
    private _children: Array<any>;
    private _childrenWidthArray: Array<number>;
    private _menuChildren: Array<HTMLElement>;
    private _toolbarChildren: Array<HTMLElement>;
    private isOpenMenu: boolean;
    private _toolbarOldWidth: number;
    private _selectedId: string;
    private _selectedAction: string;
    private _items: Array<any>;
    private _childrenWidth: number;

    public isRender: boolean;

    private _Menu: HTMLDivElement | undefined;
    private _Dots: HTMLButtonElement | undefined;
    private _MenuList: HTMLUListElement | undefined;

    private _disabled: boolean;

    constructor() {
        super();

        this._toolbarWidth = 0;
        this._children = [];
        this._childrenWidthArray = [];
        this._menuChildren = [];
        this._toolbarChildren = [];
        this.isOpenMenu = false;
        this.isRender = false;
        this._toolbarOldWidth = 0;
        this._selectedId = "";
        this._selectedAction = "";
        this._items = [];
        this._childrenWidth = 0;

        this._disabled = false;
    }

    connectedCallback() {
        this.classList.add("dp-toolbar");

        const readyState = document.readyState!;

        if (readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this._checkIsRendered());
        } else {
            this._checkIsRendered();
        }
    }

    static get observedAttributes() {
        return ["disabled"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "disabled":
                this._setDisabled(newValue);

                break;
            case "items":
                this._setItems(newValue);
        }
    }

    /**
     * @private Проверка перед рендером
     */
    private _checkIsRendered() {
        if (this.isRender) {
            return;
        }

        if (this.offsetWidth > 0) {
            this.isRender = true;
            this._render();
        }

        if ([...this.children].length === 0 && !this.isRender) {
            this.isRender = true;
            this._render();
        }

        this._widthObserver();
    }

    /**
     * @private запускаем ResizeObserver для тулбара
     */
    private _widthObserver() {
        const ro = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const width = this.offsetWidth;

                if (entry.target === this && width > 0) {
                    if (!this.isRender) {
                        this.isRender = true;
                        this._render();
                    }

                    const difference = width - this._toolbarOldWidth;

                    if (Math.abs(difference) > 10) {
                        this._resizeWindow();
                    }
                }
            }
        });

        ro.observe(this);
    }

    /**
     * @private Рендер тулбара
     */
    private _render() {
        if (this._items.length > 0) {
            this._setItems(this._items);
        } else {
            this._setToolbar();
        }

        this._addEventListeners();
    }

    /**
     * @private настраиваем компонент
     */
    private _setToolbar() {
        this._children = [...this.children];
        this._toolbarWidth = this.offsetWidth;

        if (this._children.length > 0) {
            this._childrenWidthArray = this._children.map((child: HTMLElement) => {
                if (child.tagName === "DATAPLAT-DROPDOWN-BUTTON") {
                    let grandChildren = [...child.children] as Array<HTMLElement>;
                    return grandChildren[0].offsetWidth + 26;
                } else {
                    return child.offsetWidth + 10;
                }
            });
            this._childrenWidth = 37;

            this._setInitialDisabledState();
        }

        this._Menu = this._createMenu();
        this._Dots = this._createDotsButton();
        this._setDotsButtonVisibility();

        document.body.append(this._Menu);

        this.append(this._Dots!);
        this._toolbarOldWidth = this.offsetWidth;
    }

    /**
     * @private задаем состояние блокировки тулбара
     */
    private _setInitialDisabledState() {
        DPElements.Global.CheckProperty(this, "disabled");

        if (this._disabled) {
            this._setChildrenDisabled(this._disabled, this._children);
        }
    }

    /**
     * @private создаем контекстное меню компонента
     * @returns div контекстное меню компонента
     */
    private _createMenu(): HTMLDivElement {
        const menu = document.createElement("div");
        menu.classList.add("dp-context-menu");

        this._MenuList = this._createMenuList();

        menu.append(this._MenuList);

        return menu;
    }

    /**
     * @private создаем список для контекстного меню
     * @returns ul список контекстного меню
     */
    private _createMenuList(): HTMLUListElement {
        const menuList = document.createElement("ul");
        menuList.classList.add("dp-menu-list");

        if (this._children.length > 0) {
            for (let [i, item] of this._children.entries()) {
                let child = item as HTMLElement;
                const menuListItem = this._createMenuListItem(child, i);

                menuList.append(menuListItem);
            }
        }

        return menuList;
    }

    /**
     * @private создаем элемент списка контекстного меню
     * @param child - дочерний элемент тулбара
     * @param index - индекс дочернего элемента тулбара в массиве детей тулбара
     * @returns li элемент списка контекстного меню
     */
    _createMenuListItem(child: HTMLElement, index: number): HTMLLIElement {
        const menuListItem = document.createElement("li");

        child.dataset.id = index.toString();
        menuListItem.dataset.itemId = index.toString();
        menuListItem.classList.add("dp-menu-list-item");
        this._setItemsVisibility(menuListItem, child, index);
        const menuChild = this._getMenuItem(child) as HTMLElement;

        if (child.tagName === "DATAPLAT-DROPDOWN-BUTTON") {
            menuListItem.classList.add("dp-menu-list-item-with-list");
            const subList = this._createMenuSubList(menuChild);

            menuListItem.append(subList);
        } else {
            menuListItem.append(menuChild);

            this._toolbarChildren.push(child);
            this._menuChildren.push(menuChild);
        }

        return menuListItem;
    }

    /**
     * @private устанавливаем видимость элементов тулбара и контекстного меню
     * @param menuListItem - элемент списка контекстного меню
     * @param child - элемент ребенок тулбара
     * @param index - индекс дочернего элемента тулбара в массиве детей тулбара
     */
    private _setItemsVisibility(menuListItem: HTMLLIElement, child: HTMLElement, index: number) {
        if (index === this._childrenWidthArray.length - 1) {
            if (this._childrenWidth + this._childrenWidthArray[index] - 37 < this._toolbarWidth) {
                child.dataset.visible = "true";
                menuListItem.dataset.visible = "false";
                this._childrenWidth += this._childrenWidthArray[index];
            } else {
                child.dataset.visible = "false";
                menuListItem.dataset.visible = "true";
                this._childrenWidth = Infinity;
            }

            return;
        }

        if (this._childrenWidth + this._childrenWidthArray[index] < this._toolbarWidth) {
            child.dataset.visible = "true";
            menuListItem.dataset.visible = "false";
            this._childrenWidth += this._childrenWidthArray[index];
        } else {
            child.dataset.visible = "false";
            menuListItem.dataset.visible = "true";
            this._childrenWidth = Infinity;
        }
    }

    /**
     * @private создаем подсписок контекстного меню(выполняется в случае dataplat-dropdown-button)
     * @param menuChild - ul список отображающий dataplat-dropdown-button в контекстном меню тулбара
     * @returns ul подсписок контекстного меню
     */
    private _createMenuSubList(menuChild: HTMLElement): HTMLUListElement {
        const subList = document.createElement("ul");
        const topBorderLi = document.createElement("li");
        const borderSpan = document.createElement("span");

        subList.classList.add("dp-menu-list");
        borderSpan.classList.add("dp-menu-border");
        topBorderLi.classList.add("dp-menu-list-item");
        topBorderLi.append(borderSpan);

        const bottomBorderLi = topBorderLi.cloneNode(true);
        subList.append(topBorderLi, menuChild, bottomBorderLi);

        return subList;
    }

    /**
     * @private получение элемента меню
     * @param child - элемент ребенок тулбара
     * @returns элемент контекстного меню дублирующий ребенка тулбара
     */
    private _getMenuItem(child: HTMLElement): HTMLElement | undefined {
        switch (child.tagName) {
            case "DATAPLAT-CHECKBOX-BUTTON":
                return this._getMenuCheckboxButton(child);
            case "DATAPLAT-RADIO-BUTTON":
                return this._getMenuRadioButton(child);
            case "DATAPLAT-DROPDOWN-BUTTON":
                return this._getMenuDropdownButton(child);
            case "BUTTON":
                return this._getMenuButton(child as HTMLButtonElement);
            case "SPAN":
                return this._getMenuSpan();
            default:
                return;
        }
    }

    /**
     * @private Получение элемента выпадающего списка для меню
     * @param child - элемент ребенок тулбара
     * @returns элемент контекстного меню отражающий дропдаун кнопку
     */
    private _getMenuDropdownButton(child: HTMLElement): HTMLElement {
        const dropdownButton = child as any;
        const subList = document.createElement("ul");
        const grandChildren =
            dropdownButton.dropdownChildren.length > 0
                ? dropdownButton.dropdownChildren
                : ([...dropdownButton.children] as Array<HTMLElement>);
        subList.classList.add("dp-menu-list");

        for (let [i, grandChild] of grandChildren.entries()) {
            this._toolbarChildren.push(grandChild);
            grandChild.dataset.id = child.dataset.id + i.toString();

            const li = document.createElement("li");
            li.classList.add("dp-menu-list-item");
            const menuGrandChild = this._getMenuItem(grandChild) as HTMLElement;
            this._menuChildren.push(menuGrandChild);
            li.append(menuGrandChild);
            subList.append(li);
        }

        return subList;
    }

    /**
     * @private Получение элемента чекбокс кнопки для меню
     * @param child - элемент ребенок тулбара
     * @returns элемент контекстного меню отражающий чекбокс кнопку
     */
    private _getMenuCheckboxButton(child: HTMLElement): HTMLElement {
        const checkboxButton = child as any;
        const label = document.createElement("label");
        const spanCheckbox = document.createElement("span");
        const spanText = document.createElement("span");
        const input = document.createElement("input");
        const icon = this._createIcon(checkboxButton.icon);

        input.setAttribute("type", "checkbox");
        input.checked = checkboxButton.value;
        input.classList.add("dp-menu-toggle-input");
        input.dataset.id = child.dataset.id;
        input.setAttribute("name", `menu-${checkboxButton.name}`);
        input.setAttribute("id", `menu-${checkboxButton.id}`);
        if (checkboxButton.disabled === true) {
            input.setAttribute("disabled", checkboxButton.disabled);
        }
        input.addEventListener("change", (e: Event) => {
            this._checkChanged(checkboxButton, input);
        });

        spanText.textContent = checkboxButton.title;
        spanText.classList.add("dp-menu-toggle-text");

        spanCheckbox.classList.add("dp-menu-toggle-check");
        spanCheckbox.append(icon);
        spanCheckbox.insertAdjacentElement("beforeend", spanText);

        label.dataset.id = checkboxButton.dataset.id;
        //label.setAttribute("disabled", checkboxButton.disabled);
        label.classList.add("dp-menu-toggle");
        label.append(input, spanCheckbox);

        return label;
    }

    /**
     * @private Получение элемента радио кнопки для меню
     * @param child - элемент ребенок тулбара
     * @returns элемент контекстного меню отражающий радио кнопку
     */
    private _getMenuRadioButton(child: HTMLElement): HTMLElement {
        const radioButton = child as any;
        const label = document.createElement("label");
        const spanCheckbox = document.createElement("span");
        const spanText = document.createElement("span");
        const input = document.createElement("input");
        const icon = this._createIcon(radioButton.icon);

        input.setAttribute("type", "radio");
        input.checked = radioButton.value;
        input.classList.add("dp-menu-toggle-input");
        input.dataset.id = radioButton.dataset.id;
        input.setAttribute("name", `menu-${radioButton.name}`);
        input.setAttribute("id", `menu-${radioButton.id}`);
        if (radioButton.disabled === true) {
            input.setAttribute("disabled", radioButton.disabled);
        }
        input.addEventListener("change", (e: Event) => this._checkChanged(radioButton, input));

        spanText.textContent = radioButton.title;
        spanText.classList.add("dp-menu-toggle-text");

        spanCheckbox.classList.add("dp-menu-toggle-check");
        spanCheckbox.append(icon);
        spanCheckbox.insertAdjacentElement("beforeend", spanText);

        label.dataset.id = radioButton.dataset.id;
        label.setAttribute("disabled", radioButton.disabled);
        label.classList.add("dp-menu-toggle");
        label.append(input, spanCheckbox);

        return label;
    }

    /**
     * @private Получение элемента кнопки для меню
     * @param child - элемент ребенок тулбара
     * @returns элемент контекстного меню отражающий кнопку
     */
    private _getMenuButton(child: HTMLButtonElement): HTMLElement {
        const menuChild = child.cloneNode(true) as HTMLButtonElement;
        let spanText;

        if (!menuChild.querySelector("span")) {
            spanText = document.createElement("span");
            spanText.textContent = child.title;
            menuChild.insertAdjacentElement("beforeend", spanText);
        } else {
            spanText = menuChild.querySelector("span") as HTMLSpanElement;
        }

        spanText.classList.add("dp-menu-toggle-text");
        menuChild.removeAttribute("data-visible");
        menuChild.classList.add("dp-menu-toggle-check");
        menuChild.classList.remove("dp-icon-button");

        menuChild.addEventListener("click", () => {
            child.dispatchEvent(new Event("click", { bubbles: true }));
        });

        this._disabledObserver(child, menuChild);

        return menuChild;
    }

    /**
     * @private Получение элемента спана разделителя для меню
     * @returns элемент контекстного меню отражающий спан разделителя
     */
    private _getMenuSpan(): HTMLElement {
        const span = document.createElement("span");
        span.classList.add("dp-menu-border");

        return span;
    }

    /**
     * @private создаем кнопку для открытия контекстного меню
     * @returns кнопка для открытия контекстного меню
     */
    private _createDotsButton(): HTMLButtonElement {
        const dotsButton = document.createElement("button");
        const icon = this._createIcon("menu-points");

        dotsButton.classList.add("dp-icon-button");
        dotsButton.classList.add("dp-toolbar-dots");
        dotsButton.append(icon);

        return dotsButton;
    }

    /**
     * @private - создаем иконку по id иконки в спрайте
     * @param iconPath - id иконки в спрайте
     */
    private _createIcon(iconPath: string) {
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

        use.setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            `${DPElements.IconPath}${iconPath}`
        );

        icon.classList.add("dp-icon-button-svg");
        icon.append(use);
        return icon;
    }

    /**
     * @private задаем видимость кнопки для открытия контекстного меню
     */
    private _setDotsButtonVisibility() {
        if (!this._Menu!.querySelectorAll('li[data-visible="true"]').length) {
            this._Dots!.dataset.visible = "false";
        } else {
            this._Dots!.dataset.visible = "true";
        }
    }

    /**
     * @param child элемент тулбара
     * @param menuElement элемент контекстного меню
     * @private синхронизируем состояние атрибута disabled для элементов тулбара и меню
     */
    private _disabledObserver(child: HTMLButtonElement, menuElement: HTMLElement) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(function (mutation) {

                if (mutation.attributeName === "disabled") {
                    if (child.disabled === true) {
                        menuElement.setAttribute("disabled", "");
                    } else {
                        menuElement.removeAttribute("disabled");
                    }
                }
            });
        });

        observer.observe(child, {
            attributes: true,
        });
    }

    /**
     * @param event Событие
     * @param child элемент ребенок тулбара
     * @param input инпут радио или чекбокс элемента контекстного меню
     * @private следим за изменениями в свойства checked инпутов в контекстном меню и диспатчим событие changed
     */
    private _checkChanged(
        child: DPElementCheckboxButton | DPElementRadioButton,
        input: HTMLInputElement
    ) {
        const eventChanged = new Event("changed", {
            bubbles: true,
        });

        if (child.value !== input.checked) {
            child.value = input.checked;
            child.dispatchEvent(eventChanged);

            const eventAction = new Event(child.action, {
                bubbles: true,
            });

            child.dispatchEvent(eventAction);
        }
    }

    /**
     * @private добавление глобальных слушателей событий
     */
    private _addEventListeners() {
        this.addEventListener("click", (e: MouseEvent) => this._handleClick(e));
        this._Menu!.addEventListener("click", (e: MouseEvent) => this._handleClick(e));
        this.addEventListener("changed", (e: Event) => this._handleChanged(e));
        this.addEventListener('dptoggledisabled', (e: Event) => this._handleDPToggleDisabled(e));
    }

    /**
     * @private обрабатываем клик по тулбару и диспатчим события при клике на дочерние кнопки
     * @param e - MouseEvent
     */
    private _handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const isDropdownButton = target.closest("dataplat-dropdown-button");
        const isDots = target.closest(".dp-toolbar-dots");

        if (isDropdownButton) {
            return;
        }

        if (isDots) {
            this._toggleMenu();
            return;
        }

        const button = target.closest("button") as HTMLButtonElement;

        if (!button || button.disabled) {
            return;
        }

        this._selectedId = button.id || "";
        this._selectedAction = button.dataset.action || "";

        this._dispatchChangedEvent();

        if (button.dataset.action) {
            this._dispatchActionEvent(button.dataset.action);
        }
    }

    /**
     * @private обрабатываем событие changed из дочерних компонентов тулбара
     * @param e Event
     * @returns
     */
    private _handleChanged(e: Event) {
        const target = e.target as HTMLElement;
        let element;
        let elementValue: boolean;
        let elementId: string;

        switch (target.nodeName) {
            case "DATAPLAT-CHECKBOX-BUTTON":
                element = target as DPElementCheckboxButton;
                this._selectedId = element.id;
                this._selectedAction = element.action;
                elementId = element.dataset.id!;
                elementValue = element.value!;
                break;
            case "DATAPLAT-RADIO-BUTTON":
                element = target as DPElementRadioButton;
                this._selectedId = element.id;
                this._selectedAction = element.action;
                elementId = element.dataset.id!;
                elementValue = element.value!;
                break;
            case "DATAPLAT-DROPDOWN-BUTTON":
                element = target as DPElementDropdownButton;
                this._selectedId = element.selectedId;
                this._selectedAction = element.selectedAction;
                break;
        }

        if (!element) {
            return;
        }

        if (
            element.tagName === "DATAPLAT-CHECKBOX-BUTTON" ||
            element.tagName === "DATAPLAT-RADIO-BUTTON"
        ) {
            const menuChild = this._menuChildren?.find(
                (child: HTMLElement) => child.dataset.id === elementId
            );

            element = menuChild!.querySelector("input") as HTMLInputElement;
            element.checked = elementValue!;
        }

        this._dispatchChangedEvent();

        if (this._selectedAction) {
            this._dispatchActionEvent(this._selectedAction);
        }
    }

    /**
     * @private Диспатчим событие changed
     */
    private _dispatchChangedEvent() {
        const eventChanged = new Event("changed", {
            bubbles: true,
        });

        this.dispatchEvent(eventChanged);
    }

    /**
     * @private Диспатчим событие значение дата-атрибута кнопки
     * @param action - значение дата-атрибута кнопки, по которой произошел клик
     */
    private _dispatchActionEvent(action: string) {
        const eventAction = new Event(action, {
            bubbles: true,
        });

        this.dispatchEvent(eventAction);
    }

    /**
     * @private синхронизируем заблокированнность чекбокс и радио кнопок в тулбаре и меню
     * @param e - Event
     */
    private _handleDPToggleDisabled(e: Event) {
        const target = e.target as any;
        const menuInput = this._Menu!.querySelector(`li[data-item-id="${target.dataset.id}"] input`);

        if (!menuInput) {
            return;
        }

        if (target.disabled) {
            menuInput.setAttribute('disabled', '');
        } else {
            menuInput.removeAttribute('disabled');
        }
    }

    /**
     * @private отслеживание ширины тулбара
     */
    private _resizeWindow() {
        this.isOpenMenu = false;
        this._checkPosition();
        this._Menu!.classList.remove("dp-context-menu-active");

        const menuVisibleListItems = this._Menu!.querySelectorAll(
            'li[data-visible="true"]'
        ) as unknown as Array<HTMLLIElement>;
        const toolbarVisibleButtons = this.querySelectorAll(
            '[data-visible="true"]:not(.dp-toolbar-dots):not(svg)'
        ) as unknown as Array<HTMLElement>;

        const lastToolbarVisibleButton: HTMLElement =
            toolbarVisibleButtons[toolbarVisibleButtons.length - 1];

        const firstMenuVisibleListItem: HTMLLIElement = menuVisibleListItems[0];
        const dotsPlaceholder = menuVisibleListItems.length === 0 ? 0 : 37;

        let toolbarChildrenWidth = this._childrenWidthArray.reduce(
            (acc: number, cur: number, i: number) => {
                if (i < toolbarVisibleButtons!.length) {
                    return (acc += cur);
                } else {
                    return (acc += 0);
                }
            },
            dotsPlaceholder!
        );

        if (this.offsetWidth > toolbarChildrenWidth) {
            if (!menuVisibleListItems.length) {
                return;
            }

            if (
                menuVisibleListItems.length === 1 &&
                this.offsetWidth >
                toolbarChildrenWidth +
                this._childrenWidthArray[
                firstMenuVisibleListItem.dataset.itemId as unknown as number
                ] -
                32
            ) {
                this._Dots!.dataset.visible = "false";
                this._showFirstInvisibleButton(firstMenuVisibleListItem, toolbarChildrenWidth);
            } else if (
                menuVisibleListItems.length > 1 &&
                this.offsetWidth >
                toolbarChildrenWidth +
                this._childrenWidthArray[firstMenuVisibleListItem.dataset.itemId as unknown as number]
            ) {
                this._showFirstInvisibleButton(firstMenuVisibleListItem, toolbarChildrenWidth);
            }
        } else {
            if (!lastToolbarVisibleButton) {
                return;
            }
            this._hideLastVisibleButton(lastToolbarVisibleButton, toolbarChildrenWidth);
        }

        this._toolbarOldWidth = this.offsetWidth;

        this._setDotsButtonVisibility();
    }

    /**
     * @param button - кнопка в тулбаре
     * @param toolbarChildrenWidth - сумма ширин детей тулбара
     * @private прячем в тулбаре кнопку, которая туда не вмещается, и показываем соответствующую кнопку в меню
     */
    private _hideLastVisibleButton(button: HTMLElement, toolbarChildrenWidth: number) {
        const listItem = this._Menu!.querySelector(
            `[data-item-id="${button.dataset.id}"]`
        ) as HTMLElement;

        button.dataset.visible = "false";
        listItem.dataset.visible = "true";
        toolbarChildrenWidth -= this._childrenWidthArray[button.dataset.id as unknown as number];
        const prevButton = button.previousElementSibling as HTMLElement;
        if (this.offsetWidth <= toolbarChildrenWidth) {
            if (!prevButton) {
                return;
            }
            this._hideLastVisibleButton(prevButton, toolbarChildrenWidth);
        }
    }

    /**
     * @param listItem - listItem с кнопкой в меню
     * @param toolbarChildrenWidth - сумма ширин детей тулбара
     * @private показываем в тулбаре кнопку, которая туда не вмещается, и прячем соответствующую кнопку в меню
     */
    private _showFirstInvisibleButton(listItem: HTMLLIElement, toolbarChildrenWidth: number) {
        const button = this.querySelector(`[data-id="${listItem.dataset.itemId}"]`) as HTMLElement;
        button.dataset.visible = "true";
        listItem.dataset.visible = "false";
        toolbarChildrenWidth += this._childrenWidthArray[button.dataset.id as unknown as number];
        const nextListItem = listItem.nextElementSibling as HTMLLIElement;
        if (!nextListItem) {
            return;
        }
        if (
            this.offsetWidth >=
            toolbarChildrenWidth +
            this._childrenWidthArray[nextListItem.dataset.itemId as unknown as number]
        ) {
            this._showFirstInvisibleButton(nextListItem, toolbarChildrenWidth);
        }
    }

    /**
     * @private Открытие или закрытие дополнительного выпадающего окна
     */
    private _toggleMenu() {
        if (this.isOpenMenu) {
            this.isOpenMenu = false;
            this._Menu!.classList.remove("dp-context-menu-active");
        } else {
            this.isOpenMenu = true;
            this._Menu!.classList.add("dp-context-menu-active");
            this._checkPosition();
        }
    }

    /**
     * @private Проверка позиции выпадающего списка при изменении ширины экрана
     */
    private _checkPosition() {
        const menu = this._Menu!;

        const coordWindow = new DPElements.Coordinate(this, this._Menu!);

        menu.removeAttribute("style");
        if (coordWindow.right < coordWindow.popupWidth) {
            menu.style.right = `${coordWindow.distanceOnRight - coordWindow.popupWidth + coordWindow.right
                }px`;
        } else {
            menu.style.right = `${coordWindow.distanceOnRight}px`;
        }

        if (coordWindow.distanceOnBottom > coordWindow.popupHeight) {
            menu.style.top = `${coordWindow.calcTop}px`;
        } else if (coordWindow.top > coordWindow.popupHeight) {
            menu.style.bottom = `${coordWindow.calcBottom}px`;
        } else {
            menu.style.top = `${coordWindow.calcTop}px`;
        }
    }

    /**
     * @param e - Event
     * @private закрытие меню при клике не на компонент
     */
    private _closeAllWindows(e: Event) {
        const target = e.target as HTMLElement;
        if (!target.closest(".dp-toolbar") && !target.closest(".dp-context-menu")) {
            if (this.isOpenMenu) {
                this.isOpenMenu = false;
                this._Menu!.classList.remove("dp-context-menu-active");
            }
        }
    }

    /** @private Задаем активность элемента */
    private _setDisabled(value: boolean) {
        if (typeof value === "boolean") {
            this._disabled = value;
            this._setChildrenDisabled(value, this._children);
        } else {
            this._setDisabled(value === "true" ? true : false);
        }
    }

    /**
     * @private задаем значение атрибута детей тулбара
     * в соответствии со значением атрибута disabled тулбара
     * @param value значение атрибута disabled для ребенка
     * @param children массив детей тулбара
     */
    private _setChildrenDisabled(value: boolean, children: Array<any>) {
        for (let child of children) {
            child.disabled = value;
        }
    }

    /**
     * @private динамически создаем элементы тулбара по переданному массиву
     * @param value - массив объектов с информацией о кнопках
     */
    private _setItems(value: Array<any>) {
        this._items = value;

        if (!this.isRender) {
            return;
        }

        this.innerHTML = "";
        this._Menu?.remove();
        this._toolbarWidth = 0;
        this._children = [];
        this._childrenWidthArray = [];
        this._menuChildren = [];
        this._toolbarChildren = [];
        this.isOpenMenu = false;
        this._toolbarOldWidth = 0;
        this._selectedId = "";
        this._selectedAction = "";
        for (let item of value) {
            const toolbarItem = this._createItem(item);

            this.append(toolbarItem!);
        }

        this._setToolbar();
    }

    /**
     * @private создаем элемент тулбара
     * @param item объект с информацией о кнопке
     * @returns элемент тулбара
     */
    private _createItem(item: any): any {
        let toolbarItem: any;

        switch (item.type) {
            case "button":
                toolbarItem = this._createButton(item);
                break;
            case "dataplat-checkbox-button":
                toolbarItem = this._createCheckboxButton(item);
                break;
            case "dataplat-radio-button":
                toolbarItem = this._createRadioButton(item);
                break;
            case "dataplat-dropdown-button":
                toolbarItem = this._createDropdownButton(item);
                break;
            case "separator":
                toolbarItem = this._createSeparator();
                break;
        }

        return toolbarItem;
    }

    /**
     * @private создаем кнопку
     * @param item - объект с информацией о кнопке
     * @returns button кнопку
     */
    private _createButton(item: any): HTMLButtonElement {
        const button = document.createElement("button") as HTMLButtonElement;
        const icon = this._createIcon(item.icon);

        button.classList.add("dp-icon-button");
        button.title = item.title ?? "";
        button.id = item.id ?? "";
        button.dataset.action = item.action ?? "";
        button.append(icon);

        return button;
    }

    /**
     * @private создаем чекбокс кнопку
     * @param item - объект с информацией о чекбокс кнопке
     * @returns dataplat-checkbox-button чекбокс кнопку
     */
    private _createCheckboxButton(item: any): DPElementCheckboxButton {
        const checkbox = document.createElement(
            "dataplat-checkbox-button"
        ) as DPElementCheckboxButton;

        checkbox.icon = item.icon;
        checkbox.title = item.title ?? "";
        checkbox.value = item.value ?? false;
        checkbox.action = item.action ?? "";
        checkbox.iconReplace = item.iconReplace ?? "";
        checkbox.disabled = item.disabled ?? false;
        checkbox.id = item.id ?? "";

        return checkbox;
    }

    /**
     * @private создаем радио кнопку
     * @param item - объект с информацией о радио кнопке
     * @returns dataplat-radio-button радио кнопку
     */
    private _createRadioButton(item: any): DPElementRadioButton {
        const radio = document.createElement("dataplat-radio-button") as DPElementRadioButton;

        radio.icon = item.icon;
        radio.title = item.title ?? "";
        radio.value = item.value ?? false;
        radio.action = item.action ?? "";
        radio.name = item.name ?? "";
        radio.disabled = item.disabled ?? false;
        radio.id = item.id ?? "";

        return radio;
    }

    /**
     * @private создаем dropdown кнопку
     * @param item - объект с информацией о dropdown кнопке
     * @returns dataplat-dropdown-button радио кнопку
     */
    private _createDropdownButton(item: any): DPElementDropdownButton {
        const dropdown = document.createElement(
            "dataplat-dropdown-button"
        ) as DPElementDropdownButton;

        dropdown.id = item.id ?? "";

        for (let button of item.buttons) {
            const childButton = this._createButton(button);

            dropdown.append(childButton);
        }

        return dropdown;
    }

    /**
     * @private создаем разделитель
     * @returns span разделитель
     */
    private _createSeparator(): HTMLSpanElement {
        const separator = document.createElement("span");

        separator.classList.add("dp-toolbar-border");

        return separator;
    }

    /**
     * @public блокировка/включение дочерней кнопки компонента
     * @param action - значение геттера action/атрибута data-action кнопки, которую нужно заблокировать/включить
     * @param status - true - для блокировки, false для включения
     */
    public Disable(action: string, status: boolean) {
        const button =
            (this._toolbarChildren.find(
                (button: any) => button.action === action || button.dataset.action === action
            ) as any) || (this.querySelector(`[data-action="${action}"`) as HTMLElement);

        if (!button) {
            return;
        }

        button!.disabled = status;
    }

    /**
     * @public добавление элемента в тулбар
     * @param value - объект с информацией о кнопке
     */
    public Add(button: any) {
        const item = this._createItem(button);
        this._setNewItem(item);

        const menuListItem = this._createMenuListItem(item, item.dataset.id);
        this._MenuList?.append(menuListItem);
    }

    /**
     * @public удаление дочерней элемента компонента
     * @param action - значение геттера action/атрибута data-action кнопки, которую нужно заблокировать/включить
     */
    public Remove(action: any) {
        const button =
            (this._toolbarChildren.find(
                (button: any) => button.action === action || button.dataset.action === action
            ) as any) || (this.querySelector(`[data-action="${action}"`) as HTMLElement);

        if (!button) {
            return;
        }

        const listItem =
            (this._Menu!.querySelector(`[data-item-id="${button!.dataset.id}"]`) as HTMLElement) ||
            (this._Menu!.querySelector(`[data-action="${action}"]`)?.parentElement as HTMLElement);

        button.remove();
        listItem.remove();
    }

    /**
     * @private настраиваем созданную кнопку
     * @param item созданная кнопка
     */
    private _setNewItem(item: any) {
        item.dataset.id = this._children.length;
        this._children.push(item);
        this.insertBefore(item, this._Dots!);
        this._updateChildrenWidthArray(item);
        this._setNewItemVisibility(item);
    }

    /**
     * @private обновлям данные массива с информацией о ширинах дочерних элементов тулбара
     * @param item созданная кнопка
     */
    private _updateChildrenWidthArray(item: any) {
        const width =
            item.type === "dataplat-dropdown-button"
                ? [...item.children][0].offsetWidth + 26
                : item.offsetWidth + 10;

        this._childrenWidthArray.push(width);
    }

    /**
     * @private задаем видимость созданной кнопки
     * @param item созданная кнопка
     */
    private _setNewItemVisibility(item: any) {
        item.dataset.visible = item.previousElementSibling.dataset.visible;
        const toolbarVisibleButtons = this.querySelectorAll(
            '[data-visible="true"]:not(.dp-toolbar-dots):not(svg)'
        ) as unknown as Array<HTMLElement>;

        if (item.dataset.visible === "false") {
            return;
        }

        let toolbarChildrenWidth = this._childrenWidthArray.reduce(
            (acc: number, cur: number, i: number) => {
                if (i < toolbarVisibleButtons!.length) {
                    return (acc += cur);
                } else {
                    return (acc += 0);
                }
            },
            37
        );

        if (this.offsetWidth > toolbarChildrenWidth) {
            return;
        }

        item.dataset.visible = "false";
        this._Dots!.dataset.visible = "true";
        toolbarChildrenWidth =
            toolbarChildrenWidth - this._childrenWidthArray[item.dataset.id as number] + 37;

        if (this.offsetWidth > toolbarChildrenWidth) {
            return;
        }

        item.previousElementSibling.dataset.visible = "false";
    }

    //#region геттеры и сеттеры

    /**
     * получаем значение атрибута disabled тулбара
     * @return значение атрибута disabled тулбара
     */
    get disabled(): boolean {
        return this._disabled;
    }

    /**
     * задаем значение атрибута disabled тулбара
     */
    set disabled(value: boolean) {
        this._setProperty("disabled", `${value}`);
    }

    get selectedId(): string {
        return this._selectedId;
    }

    get selectedAction(): string {
        return this._selectedAction;
    }

    get items(): Array<any> {
        return this._items;
    }

    set items(value: Array<any>) {
        this._setProperty("items", value);
    }

    //#endregion геттеры и сеттеры
}
);

customElements.define("dataplat-dropdown-button", class DataPlatDropdownButton extends HTMLElement {
    private _children: HTMLElement[];
    private _disabled: boolean;
    private _selectedAction: string;
    private _selectedId: string;

    private _Dropdown: HTMLDivElement;
    private _Arrow: HTMLButtonElement;

    public isOpenMenu: boolean;
    public isRender: boolean;
    public dropdownChildren: Array<any> = [];

    constructor() {
        super();

        this._children = [];
        this._disabled = false;
        this._selectedAction = "";
        this._selectedId = "";

        this._Dropdown = document.createElement("div");
        this._Arrow = document.createElement("button");

        this.isOpenMenu = false;
        this.isRender = false;
    }

    connectedCallback() {
        this.classList.add("dp-dropdown-button");
        this._Dropdown.classList.add("dp-context-menu");
        this._Arrow.classList.add("dp-dropdown-button-btn");

        const readyState = document.readyState!;

        if (readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this._checkIsRendered());
        } else {
            this._checkIsRendered();
        }
    }

    static get observedAttributes() {
        return ["disabled"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "disabled":
                this._setDisabled(newValue);
        }
    }

    /**
     * @private проверка перед рендером
     */
    private _checkIsRendered() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private Рендер дропдаун кнопки
     */
    private _render() {
        this._children = [...this.children] as Array<HTMLElement>;
        this.dropdownChildren = this._children;
        this.innerHTML = "";
        const dropdownList = document.createElement("ul");
        dropdownList.classList.add("dp-menu-list");

        DPElements.Global.CheckProperty(this, "disabled");

        for (let [i, child] of this._children.entries()) {
            if (i === 0) {
                const firstChild = child as HTMLElement;
                this.append(firstChild);
            } else {
                const dropdownListItem = document.createElement("li");
                const spanText = document.createElement("span");

                spanText.textContent = child.title;
                spanText.classList.add("dp-menu-toggle-text");

                child.classList.add("dp-menu-toggle-check");
                child.classList.remove("dp-icon-button");
                child.insertAdjacentElement("beforeend", spanText);
                dropdownListItem.classList.add("dp-menu-list-item");
                dropdownListItem.append(child);

                dropdownList.append(dropdownListItem);
            }
        }
        this._Dropdown.append(dropdownList);

        let span = document.createElement("span");
        span.classList.add("dp-dropdown-button-arrow");
        this._Arrow.append(span);

        this.append(this._Arrow);
        document.body.append(this._Dropdown);

        this._addEventListeners();
    }

    /**
     * @private Добавляем слушателей событий
     */
    private _addEventListeners() {
        this._Arrow.addEventListener("click", () => this._toggleMenu());
        window.addEventListener("click", (e: MouseEvent) => this._closeAllWindows(e));
        window.addEventListener("resize", () => this._closeDropdown());
        this.addEventListener("click", (e: MouseEvent) => this._handleClick(e));
        this._Dropdown.addEventListener("click", (e: MouseEvent) => this._handleClick(e));
    }

    /**
     * @private обрабатываем клик по компоненту
     * @param e - MouseEvent
     */
    _handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const button = target.closest("button") as HTMLButtonElement;

        if (!button || button.disabled) {
            return;
        }

        const isButton = this._children.indexOf(button) !== -1;

        if (!isButton) {
            return;
        }

        this._selectedId = button.id || "";
        this._selectedAction = button.dataset.action || "";

        this._dispatchChangedEvent();

        if (button.dataset.action) {
            this.DispatchActionEvent(button.dataset.action);
        }
    }

    /**
     * @private создаем событие changed
     */
    private _dispatchChangedEvent() {
        const eventChanged = new Event("changed", {
            bubbles: true,
        });

        this.dispatchEvent(eventChanged);
    }

    /**
     * @private создаем событие значение дата-атрибута кнопки
     * @param action - значение дата-атрибута кнопки, по которой произошел клик
     */
    private DispatchActionEvent(action: string) {
        const eventAction = new Event(`dp${action}`, {
            bubbles: true,
        });

        this.dispatchEvent(eventAction);
    }

    /**
     * @private Таггл выпадающего списка
     */
    private _toggleMenu() {
        if (this.isOpenMenu) {
            this.isOpenMenu = false;
            this._Dropdown.classList.remove("dp-context-menu-active");
            this._Arrow.classList.remove("dp-dropdown-button-btn-open");
        } else {
            this._checkPosition();
            this.isOpenMenu = true;
            this._Dropdown.classList.add("dp-context-menu-active");
            this._Arrow.classList.add("dp-dropdown-button-btn-open");
        }
    }

    /**
     * @private Оценка свободного пространства для выпадающего списка
     */
    private _checkPosition() {
        let menu = this._Dropdown;
        let coordWindow = new DPElements.Coordinate(this, this._Dropdown);

        menu.removeAttribute("style");
        menu.style.left = `${coordWindow.left + 5}px`;
        if (coordWindow.distanceOnBottom > coordWindow.popupHeight) {
            this._Arrow.classList.remove("dp-dropdown-button-btn-top");
            menu.style.top = `${coordWindow.calcTop}px`;
        } else if (coordWindow.top > coordWindow.popupHeight) {
            this._Arrow.classList.add("dp-dropdown-button-btn-top");
            menu.style.bottom = `${coordWindow.calcBottom}px`;
        } else {
            this._Arrow.classList.remove("dp-dropdown-button-btn-top");
            menu.style.top = `${coordWindow.calcTop}px`;
        }
    }

    /**
     *
     * @param e - Event
     * @private закрытие меню при клике не на компонент
     */
    private _closeAllWindows(e: Event) {
        const target = e.target as HTMLElement;
        if (!target.closest(".dp-dropdown-button") && !target.closest(".dp-context-menu")) {
            this._closeDropdown();
        }
    }

    /**
     * @private закрытие выпадающего списка
     */
    private _closeDropdown() {
        if (this.isOpenMenu) {
            this.isOpenMenu = false;
            this._Dropdown.classList.remove("dp-context-menu-active");
            this._Arrow.classList.remove("dp-dropdown-button-btn-open");
        }
    }

    /**
     * @private Задаем значение блокировки элемента
     * @param value - новое значение блокировки
     */
    private _setDisabled(value: boolean) {
        if (typeof value === "boolean") {
            this._disabled = value;
            this._setChildrenDisabled(value, this._children);
        } else {
            if (value === "true") {
                this._disabled = true;
                this._setChildrenDisabled(true, this._children);
            } else if (value === "false") {
                this._disabled = false;
                this._setChildrenDisabled(false, this._children);
            }
        }
    }

    /**
     * @private устанавливаем значение атрибута детей тулбара
     * в соответствии со значением атрибута disabled тулбара
     * @param value значение атрибута disabled для ребенка
     * @param children массив детей тулбара
     */
    private _setChildrenDisabled(value: boolean, children: Array<any>) {
        for (let child of children) {
            child.disabled = value;
        }
    }

    /**
     * @public блокировка/включение дочерней кнопки компонента
     * @param action - значение атрибута data-action кнопки, которую нужно заблокировать/включить
     * @param status - true - для блокировки, false для включения
     */
    public Disable(action: string, status: boolean) {
        const button = this._children.find(
            (button) => button.getAttribute("action") === action || button.dataset.action === action
        ) as HTMLButtonElement;

        button!.disabled = status;
    }

    //#region геттеры и сеттеры

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty("disabled", `${value}`);
    }

    get selectedId(): string {
        return this._selectedId;
    }

    get selectedAction(): string {
        return this._selectedAction;
    }
    //#endregion геттеры и сеттеры
}
);

customElements.define("dataplat-load", class DataplatLoad extends HTMLElement {
    private _text: string;
    private _active: boolean;
    private _size: string;

    public isRender: boolean;

    private _Container: HTMLDivElement;
    private _Spinner: HTMLDivElement;
    private _TextSpan: HTMLSpanElement;

    private _svgId: string;

    constructor() {
        super();

        this._text = "";
        this._active = false;
        this._size = "regular";
        this.isRender = false;
        this._svgId = "dpLoad" + DPElements.Global.NewGuid();

        this._Container = document.createElement("div");
        this._Spinner = document.createElement("div");
        this._TextSpan = document.createElement("span");
    }

    connectedCallback() {
        this._checkRender();
    }

    static get observedAttributes() {
        return ["text", "active", "size"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "text":
                this._setText(newValue);
                break;
            case "active":
                this._setActive(newValue);
                break;
            case "size":
                this._setSize(newValue);
                break;
        }
    }

    /** @private проверка перед рендером*/
    private _checkRender() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private рендер
     */
    private _render() {
        DPElements.Global.CheckProperty(this, "text");
        DPElements.Global.CheckProperty(this, "active");
        DPElements.Global.CheckProperty(this, "size");

        if (this._text && this._text !== "null") {
            this._TextSpan.classList.add("dp-load-text-active");
        }

        if (this._active) {
            this.classList.add("dp-load-active");
            this.parentElement!.style.position = "relative";
        }

        this._setSize(this._size);

        this.classList.add("dp-dialog");
        this.classList.add("dp-load");
        this._Container.classList.add("dp-load-container");
        this._Spinner.classList.add("dp-load-spinner");

        this._TextSpan.classList.add("dp-load-text");

        this._TextSpan.textContent = this._text;

        this._Container.append(this._Spinner, this._TextSpan);

        this.append(this._Container);
    }

    /**
     * @param value новое значение атрибута active
     * @private активация/деактивация лоадера
     */
    private _setActive(value: boolean) {
        if (typeof value === "boolean") {
            this._active = value;
            if (value) {
                this.classList.add("dp-load-active");
                if (this.parentElement) {
                    this.parentElement.style.position = "relative";
                }
            } else {
                this.classList.remove("dp-load-active");
                this.parentElement!.style.position = "";
            }
        } else {
            this._setActive(value === "true" ? true : false);
        }
    }

    /**
     * @private изменение размера индикатора загрузки
     * @param value новое значение _size
     */
    private _setSize(value: string) {
        if (value === "regular") {
            this._Spinner.dataset.size = "regular";
        } else if (value === "large") {
            this._Spinner.dataset.size = "large";
        } else if (value === "small") {
            this._Spinner.dataset.size = "small";
        }
        this._size = value;
    }

    /**
     * @param value новое значение атрибута text
     * @private активация/деактивация спана с текстом
     * для отключения текста лоадера нужно передать пустую строку("")
     */
    private _setText(value: string) {
        this._text = value;
        if (this._TextSpan) {
            this._TextSpan.textContent = value;

            if (value && value !== "null") {
                this._TextSpan.classList.add("dp-load-text-active");
            } else {
                this._TextSpan.classList.remove("dp-load-text-active");
            }
        }
    }

    //#region геттеры и сеттеры
    set text(value: string) {
        this._setProperty("text", value);
    }

    get text(): string {
        return this._text;
    }

    set active(value: boolean) {
        this._setProperty("active", `${value}`);
    }

    get active(): boolean {
        return this._active;
    }

    set size(value: string) {
        this._setProperty("size", `${value}`);
    }

    get size(): string {
        return this._size;
    }
    //#endregion
}
);

customElements.define('dataplat-select', class DataplatSelect extends HTMLElement {
    isRender: boolean;

    private _dataSource: DPDataSource | undefined;

    private _itemsInput: any;
    private _treeItems: any;
    private _treeLists: Array<HTMLElement>;
    private _width: number;
    private _isOpenMenu: boolean;
    private _isOpenTree: boolean;
    private _treeList: Array<any>;

    // #region properties
    private _multi: boolean;
    private _disabled: boolean;
    private _enable: boolean;
    private _value: string | Array<any>;
    private _search: boolean;
    private _dataTextField: string;
    private _dataValueField: string;
    private _select: number;
    private _selected: any;
    private _readonly: boolean;
    private _group: boolean;
    private _tree: boolean;
    private _clearButton: boolean;
    private _text: string;
    private _parent: string;
    private _dataIdField: string;
    private _dataParentIdField: string;
    private _nullGuid: string;
    private _dataChildrenField: string;
    private _isOpen: boolean;
    // #endregion properties

    // #region HTMLElements
    private _Select: HTMLElement;
    private _Input: HTMLInputElement;
    private _Button: HTMLButtonElement;
    private _MultiField: HTMLElement;
    private _Dots: HTMLButtonElement;
    private _ContextMenu: HTMLDivElement;
    private _SelectWindow: HTMLElement | undefined;
    private _List: HTMLElement | undefined;
    private _SearchElem: HTMLElement | undefined;
    private _SearchInput: HTMLInputElement | undefined;
    private _SearchBtn: HTMLButtonElement | undefined;
    private _ClearBtn: HTMLElement | undefined;
    private _TreeTitle: HTMLElement | undefined;

    // #endregion HTMLElements

    constructor() {
        super();
        this.isRender = false;
        this._isOpen = false;
        this._isOpenMenu = false;
        this._isOpenTree = false;


        this._itemsInput = [];
        this._treeItems = {
            treeItem: [],
            treeButtons: []
        };
        this._treeLists = [];
        this._width = 0;
        this._treeList = [];

        this._dataTextField = '';
        this._dataValueField = '';
        this._value = '';
        this._text = '';
        this._parent = '';
        this._disabled = false;
        this._enable = true;
        this._readonly = false;
        this._multi = false;
        this._group = false;
        this._tree = false;
        this._clearButton = false;
        this._search = true;
        this._select = -1;

        this._nullGuid = '00000000-0000-0000-0000-000000000000';
        this._dataIdField = 'id';
        this._dataParentIdField = 'parentId';
        this._dataChildrenField = 'children';

        this._Select = document.createElement('div');
        this._List = document.createElement('ul');
        this._Button = document.createElement('button');
        this._Input = document.createElement('input');
        this._Dots = document.createElement('button');
        this._ContextMenu = document.createElement('div');
        this._MultiField = document.createElement('div');
    }

    connectedCallback() {
        if (!this.isRender) {

            const readyState = document.readyState!;

            if (readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this._initialize();
                    this._events('loaded');
                    this.isRender = true;
                });
            } else {
                this._initialize();
                this._events('loaded');
                this.isRender = true;
            }
        }
    }

    disconnectedCallback() {
        this._Select?.remove();
        this._SelectWindow?.remove();
    }

    private _initialize() {
        this._handlerParams();
        /** Следим за шириной экрана */
        window.addEventListener('resize', () => this._resizeWindow());
        /** Рендер выпадающего списка */
        this.append(this._render()!);
        /** Рендер выпадающего списка */
        const isSub = this._checkSubList();
        if (!isSub) document.body.append(this._getSelect());
        this._handlerProperty();

        if (window.innerWidth < 768) {
            if (this._Input) {
                this._Input.readOnly = true;
                this._Input.placeholder = '';
            }
        }
    }

    /** Проверка на нахождение компонента в контекстном меню */
    private _checkSubList() {
        let sublist = this._Select.closest('.dp-menu-sublist');
        if (sublist) {
            sublist?.append(this._getSelect());
            if (this._SelectWindow) {
                this._SelectWindow.dataset.sub = 'true';
                return true;
            }
        }
    }

    static get observedAttributes() {
        return ['value', 'enable', 'select', 'readonly', 'text', 'disabled'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'dataSource':
                if (newValue instanceof DPDataSource) {
                    this.isRender ? this.SetData(newValue) : this._dataSource = newValue;
                } else {
                    throw new Error('переданное значение для dataSource не является instance класса DPDataSource');
                }
                break;
            case 'enable': {
                if (typeof newValue === 'boolean') {
                    if (newValue) this._setEnable(false);
                    if (!newValue) this._setEnable(true);
                } else {
                    if (newValue === 'false') this._setEnable(true);
                    if (newValue === 'true') this._setEnable(false);
                }
                break;
            }
            case 'disabled': {
                if (typeof newValue === 'boolean') {
                    this._setEnable(newValue);
                } else {
                    if (newValue === 'false') this._setEnable(false);
                    if (newValue === 'true') this._setEnable(true);
                }
                break;
            }
            case 'value': {
                if (this.multi && typeof newValue === 'string') {
                    this._setValue(newValue.replace(/\s+/g, '').split(','));
                } else {
                    this._setValue(newValue);
                }
                break;
            }
            case 'text': {
                this._setText(newValue);
                break;
            }
            case 'select': {
                this._setSelect(+newValue);
                break;
            }
            case 'readonly': {
                if (typeof newValue === 'boolean') {
                    this._readOnly(newValue);
                } else {
                    if (newValue === 'false') this._readOnly(false);
                    if (newValue === 'true') this._readOnly(true);
                }
                break;
            }
        }
    }

    /** Обработка параметров */
    private _handlerParams() {
        DPElements.Global.CheckProperty(this, 'dataSource');
        DPElements.Global.CheckProperty(this, 'dataTextField', false);
        DPElements.Global.CheckProperty(this, 'dataValueField', false);
        DPElements.Global.CheckProperty(this, 'group', false);
        DPElements.Global.CheckProperty(this, 'tree', false);
        DPElements.Global.CheckProperty(this, 'multi', false);
        DPElements.Global.CheckProperty(this, 'clearButton', false);
    }

    /** Обработка свойств */
    private _handlerProperty() {
        DPElements.Global.CheckProperty(this, 'value');
        DPElements.Global.CheckProperty(this, 'select');
        DPElements.Global.CheckProperty(this, 'text');
        DPElements.Global.CheckProperty(this, 'enable');
        DPElements.Global.CheckProperty(this, 'disabled');
        DPElements.Global.CheckProperty(this, 'readonly');
    }

    /** Проверка на наличие модели в схеме dataSource */
    private _checkDataParams() {
        if (this._dataSource) {
            this._dataIdField = this._dataSource.idParam;
            this._dataParentIdField = this._dataSource.parentIdParam;
            this._dataChildrenField = this._dataSource.children!;
        }
    }

    /** Проверка на наличие выбранной модели */
    private _checkStatus() {
        if (!this._selected) {
            if (this._value) {
                this._setValue(this._value);
            } else if (this._select !== -1) {
                this._setSelect(this._select);
            } else if (this._text) {
                this._setText(this._text);
            }
        }
    }

    /**
     * Обрабатываем список данных
     * @param list - список из источника данных dataSource
     */
    private _handleList(list: Array<any>) {
        let children: any = {};
        this._treeList = list;
        if (!this.dataSource!.isTree) {
            for (let item of list) {
                if (item[this._dataParentIdField] && item[this._dataParentIdField] !== this._nullGuid) {
                    if (children[item[this._dataParentIdField]]) {
                        children[item[this._dataParentIdField]].push(item);
                    } else {
                        children[item[this._dataParentIdField]] = [item];
                    }
                }
            }

            const findChildren = (parent: any) => {
                if (children[parent[this._dataIdField]]) {
                    parent.hasChildren = true;
                    for (let child of children[parent[this._dataIdField]]) {
                        findChildren(child);
                    }
                }
            };

            for (let root of this._treeList) {
                findChildren(root);
            }
        }
    }

    /**
     * Закрытие выпадающего списка при клике вне списка
     * @param e - событие
     */
    private _closeAllWindows = (e: Event) => {
        let condition: any;
        const target = e.target as HTMLElement;
        const button = this._Select?.querySelector('.dp-custom-select-btn');
        const menuBtn = this._Select?.querySelector('.dp-custom-select-dots-active');
        if (menuBtn) {
            condition =
                target.closest('button') !== menuBtn &&
                target.closest('button') !== button &&
                !target.closest('.dp-custom-select-window') &&
                !target.closest('.dp-custom-select-option') &&
                !target.closest('.dp-custom-multiselect-value') &&
                !target.closest('.dp-custom-select-menu');
        } else {
            condition =
                target.closest('button') !== button &&
                !target.closest('.dp-custom-select-window') &&
                !target.closest('.dp-custom-select-option') &&
                !target.closest('.dp-custom-multiselect-value');
        }
        if (condition) {
            if (this._isOpen) {
                this._toggle();
            }
            if (this._isOpenMenu) this._toggleMenu();
        }
    };

    /** Проверка позиции выпадающего списка при изменении ширины экрана */
    private _resizeWindow() {
        const width = document.documentElement.clientWidth;
        if (width > 768) {
            this._checkPosition();
        }

        if (this._Input) {
            if (width < 768 && !this.multi) {
                if (!this._Input.readOnly) {
                    this._Input.readOnly = true;
                    this._Input.placeholder = '';
                    this._SearchElem?.classList.remove('dp-custom-select-search-visible');
                }
            }
            if (width > 768 && !this.multi) {
                if (this._Input.readOnly && !this.readonly) {
                    this._SearchElem?.classList.add('dp-custom-select-search-visible');
                    this._Input.readOnly = false;
                    this._Input.placeholder = 'Введите текст';
                }
            }
        }
    }

    /**
     * Рендер элемента в DOM
     * @returns select || multi-select
     */
    private _render() {
        this._Select?.classList.add('dp-custom-select');
        this._Select?.classList.add('dp-custom-select-hover');
        this._Select?.classList.add('dp-custom-select-active-click');

        if (!this.multi) {
            this._Input?.classList.add('dp-custom-select-input');
            this._Input?.addEventListener('focus', () => {
                this._Select?.classList.add('dp-custom-select-focus');
            });
            this._Input?.addEventListener('blur', () => {
                this._Select?.classList.remove('dp-custom-select-focus');
            });
            this._Input?.addEventListener('input', () => this._eachChangeInput());
            this._Input?.addEventListener('change', () => this._changeInput());
            this._Input?.addEventListener('keypress', (e) => this._handlePressOnEnter(e));
        } else if (this.value === '') {
            this._value = [];
            this._selected = [];
        }

        if (this.clearButton) {
            this._ClearBtn = document.createElement('button');
            this._ClearBtn.classList.add('dp-custom-select-close-btn');
            this._ClearBtn.insertAdjacentHTML(
                'afterbegin',
                '<svg class="dp-custom-select-clear-icon"><use xlink:href="' + DPElements.IconPath + 'close"></use></svg>'
            );
            this._ClearBtn.addEventListener('click', () => this._clickOnClear());
        }

        if (!this._Button?.classList.contains('dp-custom-select-btn')) {
            this._Button?.classList.add('dp-custom-select-btn');
            this._Button?.addEventListener('click', () => this._clickOnArrowButton());
            if (this.disabled) {
                this._Button.setAttribute('disabled', 'disabled');
            }
        }

        if (!this._Button?.childNodes.length) {
            let arrow = document.createElement('span');
            arrow.classList.add('dp-custom-select-arrow');
            this._Button?.append(arrow);
        }

        if (!this.multi && this.clearButton) {
            this._Select?.append(this._Input!, this._ClearBtn!, this._Button!);
        } else if (!this.multi) {
            this._Select?.append(this._Input!, this._Button!);
        }
        if (this.multi) {
            this._renderMulti();
        }

        return this._Select;
    }

    /** Обрабатываем клик на кнопку очистить */
    private _clickOnClear() {
        if (!this._multi) {
            this._removeValue(true);
            this._createNewEvent('');
        } else {
            this._filter('');
            if (this._SearchInput) this._SearchInput.value = '';
            this._showClearBtn();
        }
    }

    /** Обрабатываем клик на стрелку открытия/закрытия */
    private _clickOnArrowButton() {
        if (!this.tree) {
            this._turnFilter();
        }
        if (this._Input?.value === this._value && !this._isOpenTree) {
            this._removeItemStyle();
        }
        this._toggle();
        this._checkPosition();
    }

    /**
     * Обрабатываем нажатие на Enter после ввода значения
     * @param e - события нажатия клавиатуры
     */
    private _handlePressOnEnter(e: KeyboardEvent) {
        const key = e.code;
        if (key === 'Enter') {
            this._toggle();
            this._checkPosition();
        }
    }

    /** Обнуляем значение */
    private _resetValue() {
        if (this._Input) {
            const value = this._Input.value;

            if (this.text !== value) {
                if (this._selected?.DataElement) {
                    this._selected.DataElement.dataset.selected = 'false';
                }
                this._select = -1;
                this._value = '';
                this._parent = '';
                this.text = this._Input.value;
                this._filter('');
                if (this._value) {
                    if (this._dataSource) {
                        const model = this._dataSource?.GetById(this._value);
                        if (model) {
                            this._createNewEvent(model);
                        }
                    }
                } else {
                    this._createNewEvent(value);
                }
            }
        }
    }

    /** Фиксируем изменение при каждом вводе символа в поле ввода */
    private _eachChangeInput() {
        if (this._Input) this._filter(this._Input.value);
        this._checkPosition();
        this._isOpen = true;
        this.Open();
        const closeWindow = (e: any) => this._closeAllWindows(e);
        window.addEventListener('mousedown', closeWindow);
        this._showClearBtn();
    }

    /** Фиксируем изменение при окончании ввода символов в поле ввода */
    private _changeInput() {
        this._Select?.classList.remove('dp-custom-select-selected');
        this._showClearBtn();
    }

    /** Показываем или скрываем кнопку очистки */
    private _showClearBtn() {
        if (this._ClearBtn) {
            let condition: boolean;
            if (this.multi) {
                if (this._SearchInput) {
                    condition = this.clearButton && this._SearchInput.value !== '';
                }
            } else {
                condition = this.clearButton && this._Input?.value !== '';
            }
            if (condition!) {
                this._ClearBtn.classList.add('dp-custom-select-close-btn-open');
                if (this.disabled) {
                    this._ClearBtn.setAttribute('disabled', 'disabled');
                    this._ClearBtn.classList.add('dp-custom-select-close-btn-enable');
                }
            } else {
                this._ClearBtn.classList.remove('dp-custom-select-close-btn-open');
            }
        }
    }

    /** Рендер элемента select-multi DOM */
    private _renderMulti() {
        this._MultiField.classList.add('dp-custom-multiselect-field');
        let span = document.createElement('span');
        span.innerText = 'Выберите элементы списка';
        this._MultiField.append(span);
        this._ContextMenu.classList.add('dp-custom-select-menu');
        this._Dots.classList.add('dp-custom-select-dots');
        this._Dots.addEventListener('click', () => {
            this._toggleMenu();
            this._checkPosition();
        });
        for (let i = 0; i < 3; i++) {
            let span = document.createElement('span');
            this._Dots.append(span);
        }
        this._Select.append(this._MultiField, this._Dots, this._Button);
        document.body.append(this._ContextMenu);
    }

    /**
     * Обновление списка при добавлении элемента.
     * @param model - новый элемент
     */
    private _refreshAdd(model: any) {
        if (this._dataSource) {
            if (model[this._dataParentIdField]) {
                const dataModel = this._dataSource.GetById(model[this._dataParentIdField]);
                if (dataModel) {
                    const item = dataModel.DataElement;
                    if (item) {
                        let group = null;
                        if (this._tree) {
                            group = item.querySelector('.dp-custom-select-tree') as HTMLUListElement;
                        } else if (this._group) {
                            group = item.querySelector('.dp-custom-select-group') as HTMLUListElement;
                        }
                        if (group) {
                            group.append(this._createItem(model));
                        }
                    }
                }
            } else {
                this._List?.append(this._createItem(model));
            }
        }
    }

    /**
     * Обновление списка при удалении элемента
     * @param model - элемент, который необходимо удалить
     */
    private _refreshRemove(model: any) {
        const item = model.DataElement;
        if (item) {
            item.remove();
            if (model[this._dataValueField] === this._value) {
                this._removeValue();
            }
        }

        if (this.multi) {
            for (let elem of this._itemsInput) {
                if (model.uid === elem.dataset.uid) {
                    this._removeItemsMulti(model, elem, this._itemsInput);
                    break;
                }
            }
        }
    }

    /** Удаление значений value, index и fieldValue */
    private _removeValue(isClearBtn: boolean = false) {
        if (!this.multi) {
            if (this._selected?.DataElement) {
                this._selected.DataElement.dataset.selected = 'false';
            }
            this._value = '';
            this._select = -1;
            this._text = '';
            this._parent = '';
            this._Input.value = '';
            this._Select.classList.remove('dp-custom-select-selected');
            this._showClearBtn();
            this._filter(this._Input.value);
        } else {
            if (typeof this._selected === 'object') {
                if (this._selected.length) {
                    for (let model of this._selected) {
                        const item = model.DataElement;
                        if (item) {
                            item.dataset.selected = 'false';
                        }
                    }
                }
            }
            if (!isClearBtn) {
                this._value = [];
                this._itemsInput.map((item: any) => item.remove());
                this._itemsInput = [];
                this._width = 0;
            }
            if (this.search) {
                if (this._SearchInput) {
                    this._SearchInput.value = '';
                    this._filter(this._SearchInput.value);
                }
            }
            this._showClearBtn();
        }
    }

    /**
     * Удаление элемента и редактирование значений value
     * @param model
     * @param item
     * @param items - массив, в котором находится элемент
     */
    private _removeItemsMulti(model: any, item: HTMLElement, items: any) {
        const index = items.indexOf(item);
        if (index !== -1) {
            if (this.multi) {
                if (typeof this.value === 'object') {
                    this._value = this.value.filter((value) => value !== model[this.dataValueField]);
                    this._selected = this._selected.filter((selectedModel: any) => {
                        if (selectedModel[this.dataValueField] !== model[this.dataValueField]) {
                            return selectedModel;
                        }
                    });
                }
            }
            if (item) item.remove();
            items.splice(index, 1);
        }
    }

    /**
     * Рендер родительских элементов дерева
     * @param model - class DPDataSource
     */
    private _getTreeParents(model: any) {
        let treeList = document.createElement('ul');
        treeList.classList.add('dp-custom-select-tree');
        this._treeLists.push(treeList);

        return treeList;
    }

    /**
     * Рендер родительских элементов группы
     * @param model
     */
    private _getGroupParents(model: any) {
        let groupList = document.createElement('ul');
        groupList.classList.add('dp-custom-select-group');
        let title = document.createElement('div');
        title.classList.add('dp-custom-select-title');
        title.innerHTML = model[this.dataTextField];
        groupList.append(title);
        this._treeLists.push(groupList);

        return groupList;
    }

    /** Создаем список на основе пришедших данных */
    private _createList() {
        this._resetProperties();

        if (this._List === undefined) {
            this._List = document.createElement('ul');
        }
        this._List.innerHTML = '';
        this._List.classList.add('dp-custom-select-list');
        this._List.addEventListener('click', (e) => this._handlerClick(e, 0));
        this._Button.removeAttribute('disabled');

        for (let model of this._treeList) {
            if (this._tree || this._group) {
                if (!model[this._dataParentIdField] || model[this._dataParentIdField] === this._nullGuid) {
                    this._List.append(this._createItem(model));
                }
            } else {
                this._List.append(this._createItem(model));
            }
        }

        this._checkStatus();


        this._getSubscription();

        this._events('dataload');
    }

    /**
     * Создаем элемент списка
     * @param model - модель dataSource
     */
    private _createItem(model: any) {
        let item = document.createElement('li');
        item.classList.add('dp-custom-select-item');
        item.dataset.uid = model['uid'];
        model.DataElement = item;

        const button = this._createButton(model);
        item.append(button);

        if (model[this._dataChildrenField]?.length || model.hasChildren) {
            if (this._tree) {
                button.classList.remove('dp-custom-select-button');
                button.classList.add('dp-custom-select-tree-button');
                const tree = this._getTreeParents(model);
                item.append(tree);
                this._createChildrenItems(model, tree);
            } else if (this._group) {
                const group = this._getGroupParents(model);
                button.dataset.group = 'true';
                item.append(group);
                this._createChildrenItems(model, group);
            }
        }
        if (!model[this._dataParentIdField] && this._tree) {
            this._treeItems.treeItem.push(item);
        }

        return item;
    }

    /**
     * Создаем дочерние элементы
     * @param model - модель элемента
     * @param tree
     */
    private _createChildrenItems(model: any, tree: HTMLElement) {
        const item = model.DataElement;
        if (item) {
            const children = model[this._dataChildrenField] || this._getChildren(model);
            for (let child of children) {
                tree.append(this._createItem(child));
            }
        }
    }

    /**
     * Получаем дочерние элементы
     * @param model - модель элемента списка
     */
    private _getChildren(model: any) {
        let children = [];

        for (let item of this._treeList) {
            if (model[this._dataIdField] === item[this._dataParentIdField]) {
                children.push(item);
            }
        }
        return children;
    }

    /**
     * Создаем кнопку элемента
     * @param model - модель dataSource
     */
    private _createButton(model: any) {
        let button = document.createElement('button');
        button.classList.add('dp-custom-select-button');

        if (model[this._dataChildrenField]?.length || model.hasChildren && this._tree) {
            this._createTreeButton(button, model);
        } else {
            button.innerText = model[this._dataTextField];
        }
        if (!model[this._dataParentIdField] && this._tree) {
            this._treeItems.treeButtons.push(button);
        }

        return button;
    }

    /**
     * Создаем элементы для кнопки в режиме дерева
     * @param button - созданная кнопка
     * @param model - модель dataSource
     */
    private _createTreeButton(button: HTMLButtonElement, model: any) {
        let treeName = document.createElement('div');
        treeName.classList.add('dp-custom-select-text');
        treeName.innerHTML = model[this.dataTextField];

        let treeNextBtn = document.createElement('button');
        treeNextBtn.classList.add('dp-custom-select-tree-next-btn');

        treeNextBtn.insertAdjacentHTML(
            'afterbegin',
            '<svg class="dp-custom-select-back-arrow"><use xlink:href="' + DPElements.IconPath + 'back"></use></svg>'
        );

        button.append(treeName, treeNextBtn);
    }

    /**
     * Клик по вкладке
     * @param button
     */
    private _clickOnTree(button: HTMLButtonElement) {
        const list = button.nextElementSibling as HTMLUListElement;
        if (list) {
            list.dataset.opened = 'true';
            this._isOpenTree = true;
            if (this._TreeTitle) {
                this._TreeTitle.parentElement?.classList.add('dp-custom-select-tree-header-open');
                this._TreeTitle.innerHTML = button.innerText;
            }
        }
        button.dataset.visible = 'false';
        let uid = button.parentElement!.dataset.uid;
        for (let item of this._treeItems.treeItem) {
            if (item!.dataset.uid !== uid) {
                item.dataset.visible = 'false';
            }
        }
        this._turnFilter();
    }

    /** Закрытие вкладки */
    private _closeTree() {
        for (let list of this._treeLists) {
            if (list.dataset.opened === 'true') {
                this._isOpenTree = false;
                list.dataset.opened = 'false';

                const button = list.previousElementSibling as HTMLButtonElement;
                if (button) {
                    button.dataset.visible = 'true';
                }

                this._TreeTitle?.parentElement?.classList.remove(
                    'dp-custom-select-tree-header-open'
                );
                this._removeItemStyle();
            }
        }
    }

    /** Удаление стилей для отображения вкладок при открытии списка с заданным значением */
    private _removeItemStyle() {
        for (let item of this._treeItems.treeItem) {
            item.dataset.visible = 'true';
        }
    }

    /** Открытие или закрытие дополнительного выпадающего окна */
    private _toggleMenu() {
        if (this._isOpenMenu) {
            this._isOpenMenu = false;
            this._ContextMenu.classList.remove('dp-custom-select-menu-active');
            window.removeEventListener('mousedown', this._closeAllWindows, { capture: true });
        } else {
            this._isOpenMenu = true;
            this._ContextMenu.classList.add('dp-custom-select-menu-active');
            if (this._isOpen) {
                this._toggle();
            }
            /** Закрытие окон при клике вне окон календаря и времени */
            window.addEventListener('mousedown', this._closeAllWindows, { capture: true });
        }
    }

    /** Получаем select или multi-select в DOM */
    private _getSelect() {
        if (!this._SelectWindow) {
            this._SelectWindow = document.createElement('div');
        }
        this._SelectWindow.innerHTML = '';
        this._SelectWindow.classList.add('dp-custom-select-window');

        if (this.tree) {
            const treeHeader = document.createElement('header');
            treeHeader.classList.add('dp-custom-select-tree-header');
            treeHeader.addEventListener('click', () => {
                this._closeTree();
                this._turnFilter();
            });

            let treeBackBtn = document.createElement('button');
            treeBackBtn.classList.add('dp-custom-select-tree-back');
            treeBackBtn.insertAdjacentHTML(
                'afterbegin',
                '<svg class="dp-custom-select-back-arrow"><use xlink:href="' + DPElements.IconPath + 'back"></use></svg>'
            );

            this._TreeTitle = document.createElement('p');

            treeHeader.append(treeBackBtn, this._TreeTitle);
            this._SelectWindow.append(treeHeader);
        }

        if (this.dataSource?.data?.list?.length) {
            this._checkDataParams();
            this._handleList(this.dataSource!.data.list);
            this._createList();
        }


        this._SelectWindow.append(this._getSearch(), this._List!);
        if (!this.multi) {
            this._SearchElem?.classList.add('dp-custom-select-search-visible');
        }

        return this._SelectWindow;
    }

    /** Включает фильтр при выходе из вкладки или открытии выпадающего списка */
    private _turnFilter() {
        if (!this.search) {
            if (this._Input.value !== this.text) {
                this._filter(this._Input.value);
            }
        } else {
            if (this._SearchInput) {
                if (this._SearchInput.value !== this.text) {
                    this._filter(this._SearchInput.value);
                }
            }
        }
    }

    /**
     * Клик по пункту меню
     * @param e - событие
     * @param i - индекс
     */
    private _handlerClick(e: Event, i: number) {
        if (this._MultiField.querySelector('span')) {
            this._MultiField.querySelector('span')?.remove();
        }
        const button = e.target as HTMLButtonElement;
        const item = button.parentElement as HTMLLIElement;
        if (item) {
            if (button.classList.contains('dp-custom-select-button') || button.classList.contains('dp-custom-select-tree-button')) {
                if (item.dataset.selected === 'true') {
                    if (this.multi) {
                        for (let elem of this._itemsInput) {
                            if (elem.dataset.uid === item.dataset.uid) {
                                item.dataset.selected = 'false';
                                this._width -= elem.textContent.length * 12;
                                const model = this._dataSource?.GetByUid(elem.dataset.uid);
                                if (model) {
                                    this._removeItemsMulti(model, elem, this._itemsInput);
                                }
                                this._changeMultiField();
                                this._createNewEvent('');
                            }
                        }
                    }
                    return;
                } else {
                    this._setActiveButton(button, item);
                }
                if (!this.multi) {
                    if (this._tree && !button.nextElementSibling) {
                        this._checkPosition();
                    }
                }
            }
        }
    }

    private _setActiveButton(button: HTMLButtonElement, item: HTMLLIElement) {
        if (this._tree && button.nextElementSibling) {
            this._clickOnTree(button);
        } else {
            if (button.parentElement?.dataset.uid) {
                if (this._selected?.DataElement) {
                    this._selected.DataElement.dataset.selected = 'false';
                }

                this._selected = this.dataSource?.GetByUid(button.parentElement.dataset.uid);

                this._setValue(this._selected[this._dataValueField]);
                if (!this._multi) this._toggle();

                this._createNewEvent(this._selected);
                this._Select.classList.add('dp-custom-select-selected');
            }
            if (!this.multi) {


                item.dataset.selected = 'true';
            } else {
                item.dataset.selected = 'true';
            }
        }
    }

    /**
     * Задаем индекс выбранного элемента и значение value
     * @param index - индекс
     */
    private _setSelect(index: number) {
        if (index === 0 || index) {
            this._select = index;
            if (this._treeList?.length) {
                const model = this._dataSource?.GetByIndex(index);
                if (model) {
                    if (this._multi) {
                        const item = model.DataElement;
                        if (item) {
                            this._setValueMulti(item);
                            if (typeof this.value === 'object') {
                                this.value.push(model[this._dataValueField]);
                            }
                        }
                    } else {
                        this.value = model[this._dataValueField];
                    }
                }
            }
        } else {
            throw Error('Tип id !== number');
        }
    }

    /**
     * Задаем значения в поле MultiField
     * @param elem - элемент
     */
    private _setValueMulti(elem: HTMLElement) {
        if (this._MultiField.querySelector('span')) {
            this._MultiField.querySelector('span')?.remove();
        }

        const equalItem = this._itemsInput.find((item: HTMLElement) => item.dataset.uid === elem.dataset.uid);


        if (!equalItem) {
            let option = document.createElement('button');
            option.classList.add('dp-custom-multiselect-value');
            option.innerText = elem.innerText;
            option.dataset.uid = elem.dataset.uid;

            let cross = document.createElement('button');
            cross.classList.add('dp-custom-select-value-cross');
            cross.addEventListener('click', (e) => {
                this._clickOnOptionCross(e);
            });

            option.append(cross);
            this._itemsInput.push(option);
            this._width += option.textContent!.length * 12;

            if (this._width > this._MultiField.offsetWidth - 10) {
                this._Dots.classList.add('dp-custom-select-dots-active');
                option.classList.remove('dp-custom-multiselect-value');
                option.classList.add('dp-custom-multiselect-value-list');
                this._ContextMenu.append(option);
            } else {
                this._MultiField.append(option);
            }
        }
    }

    /**
     * Клик по пункту в MultiField для его удаления
     * @param e - событие
     */
    private _clickOnOptionCross(e: Event) {
        if (this._MultiField.querySelector('span')) {
            this._MultiField.querySelector('span')?.remove();
        }

        const target = e.target as HTMLElement;
        if (target) {
            const item = target.parentElement as HTMLElement;
            if (item) {
                if (this._treeList?.length) {
                    if (item.dataset.uid) {
                        const model = this._dataSource?.GetByUid(item.dataset.uid);
                        if (model) {
                            const dataItem = model.DataElement;
                            if (dataItem) dataItem.dataset.selected = 'false';
                            this._width -= item.textContent!.length * 12;
                            this._removeItemsMulti(model, item, this._itemsInput);
                        }
                    }
                }
                this._changeMultiField();
                this._createNewEvent('');
            }
        }
    }

    /**
     * Метод, который регулирует показ в Field элементов
     */
    private _changeMultiField() {
        let freeWidth = 0;
        let widthChildren = 0;

        if (this._MultiField.childNodes.length) {
            this._MultiField.querySelectorAll('button').forEach((button: HTMLButtonElement) => {
                widthChildren += button.textContent!.length * 12;
                freeWidth = this._MultiField.offsetWidth - widthChildren;
            });
        } else {
            freeWidth = this._MultiField.offsetWidth;
        }

        if (this._ContextMenu.childNodes.length) {
            const childrenMenu = this._ContextMenu.querySelectorAll(
                '.dp-custom-multiselect-value-list'
            );
            childrenMenu.forEach((child: Element) => {
                if (freeWidth > child.textContent!.length * 12) {
                    freeWidth -= child.textContent!.length * 12;
                    child.classList.remove('dp-custom-multiselect-value-list');
                    child.classList.add('dp-custom-multiselect-value');
                    this._MultiField.append(child);
                }
            });
        }

        if (!this._ContextMenu.childNodes.length) {
            this._Dots.classList.remove('dp-custom-select-dots-active');
            this._isOpenMenu = false;
            this._ContextMenu.classList.remove('dp-custom-select-menu-active');
        }

        if (!this._ContextMenu.childNodes.length && !this._MultiField.childNodes.length) {
            let span = document.createElement('span');
            span.innerText = 'Выберите элементы списка';
            this._MultiField.append(span);
        }
    }

    /**
     * Создаем событие при изменении значения
     * @param event - событие
     */
    private _createNewEvent(event: any) {
        let dataItem = [];
        if (this.multi) {
            for (let itemInput of this._itemsInput) {
                for (let model of this.dataSource?.data?.list) {
                    if (model.uid === itemInput.dataset.uid) {
                        dataItem.push(model);
                    }
                }
            }

            if (dataItem.length) {
                this._selected = dataItem;
            } else {
                this._selected = '';
            }

        }

        let ChangedEvent = new CustomEvent('changed', {
            detail: {
                element: this._selected
            }
        });
        this.dispatchEvent(ChangedEvent);
    }

    /**
     * Получаем поле поиска в DOM
     * @returns поле поиска
     */
    private _getSearch() {
        this._SearchElem = document.createElement('div');
        this._SearchElem.classList.add('dp-custom-select-search');

        this._SearchInput = document.createElement('input');
        this._SearchInput.classList.add('dp-custom-select-search-input');
        this._SearchInput.setAttribute('placeholder', 'Поиск');
        this._SearchInput.addEventListener('focus', () => {
            this._SearchElem?.classList.add('dp-custom-select-search-focus');
        });
        this._SearchInput.addEventListener('blur', () => {
            this._SearchElem?.classList.remove('dp-custom-select-search-focus');
        });
        this._SearchInput.addEventListener('input', () => {
            this._filter(this._SearchInput!.value);
            this._showClearBtn();
        });

        this._SearchBtn = document.createElement('button');
        this._SearchBtn.classList.add('dp-custom-select-search-btn');
        this._SearchBtn.addEventListener('click', () => {
            this._filter(this._SearchInput!.value);
        });

        // this._SearchBtn.insertAdjacentHTML(
        //     'afterbegin',
        //     '<svg class="dp-custom-select-search-icon"><use xlink:href="' + DPElements.IconPath + 'search"></use></svg>'
        // );

        if (this.clearButton && this.multi) {
            this._SearchElem.append(this._SearchInput, this._ClearBtn!, this._SearchBtn);
        } else if (!this.multi || (!this.clearButton && this.multi)) {
            this._SearchElem.append(this._SearchInput, this._SearchBtn);
        }

        return this._SearchElem;
    }

    /**
     * Фильтруем элементы по значению поиска
     * @param valueInput - значение поиска
     */
    private _filter(valueInput: string) {
        if (this._List) {
            let buttons = this._List.getElementsByTagName('button');
            let options = this._treeItems.treeItem;
            const value = valueInput.toUpperCase();
            this._treeFilter(value, options, true);
            for (let i = 0; i < buttons.length; i++) {
                let liValue = buttons[i].textContent || buttons[i].innerText;
                if (liValue.toUpperCase().indexOf(value) > -1) {
                    buttons[i].style.display = '';
                    const item = buttons[i].closest('.dp-custom-select-tree') as HTMLLIElement;
                    if (item) {
                        const itemButton = item.firstElementChild as HTMLButtonElement;
                        if (itemButton) {
                            itemButton.style.display = '';
                        }
                    }
                } else {
                    if (this._isOpenTree || !this._tree) {
                        buttons[i].style.display = 'none';
                    }
                }
            }
            this._treeFilter(value, options, false);
        }
    }

    /**
     * Фильтр первого уровня дерева
     * @param value - значение поля поиска
     * @param options - пункты меню
     * @param isNone - true | false - определяет использование else if
     */
    private _treeFilter(value: string, options: Array<HTMLElement>, isNone: boolean) {
        if (this.tree && !this._isOpenTree) {
            for (let i = 0; i < options.length; i++) {
                let liValue = options[i].textContent || options[i].innerText;
                if (liValue.toUpperCase().indexOf(value) > -1) {
                    options[i].style.display = '';
                } else if (isNone) {
                    options[i].style.display = 'none';
                }
            }
        }
    }

    /** Проверяем позицию элемента перед открытием */
    private _checkPosition() {
        if (this._SelectWindow) {
            const coordinate = new DPElements.Coordinate(this._Select, this._SelectWindow);
            const selectWidth = this._Select.offsetWidth;
            const menuHeight = this._ContextMenu.offsetHeight;

            this._SelectWindow.removeAttribute('style');
            this._ContextMenu.removeAttribute('style');
            if (window.innerWidth > 768) {
                this._SelectWindow.style.width = `${selectWidth}px`;
                if (coordinate.distanceOnBottom > menuHeight) {
                    this._ContextMenu.style.top = `${coordinate.calcTop + 2}px`;
                    this._ContextMenu.style.right = `${coordinate.distanceOnRight}px`;
                } else if (coordinate.top > menuHeight) {
                    this._ContextMenu.style.bottom = `${coordinate.calcBottom + 2}px`;
                    this._ContextMenu.style.right = `${coordinate.distanceOnRight}px`;
                }

                if (coordinate.distanceOnBottom > coordinate.popupHeight!) {
                    this._SelectWindow.style.top = `${coordinate.calcTop}px`;
                    this._SelectWindow.style.left = `${coordinate.left}px`;
                    this._SelectWindow.classList.remove('dp-custom-select-window-top');
                    this._Select.classList.remove('dp-custom-select-top');
                    this._Button.classList.remove('dp-custom-select-arrow-top');
                } else if (coordinate.top > coordinate.popupHeight!) {
                    this._SelectWindow.style.bottom = `${coordinate.calcBottom}px`;
                    this._SelectWindow.style.left = `${coordinate.left}px`;
                    this._SelectWindow.classList.add('dp-custom-select-window-top');
                    if (this._Select.classList.contains('dp-custom-select-top')) {
                        this._Select.classList.remove('dp-custom-select-top');
                    } else {
                        this._Select.classList.add('dp-custom-select-top');
                    }
                    this._Button.classList.add('dp-custom-select-arrow-top');
                }
            }
        }
    }

    /** Открытие или закрытие элемента */
    private _toggle() {
        if (this._isOpen) {
            if (this._Input.value === '' && this.value !== '') {
                this._Input.value = this.text;
                this._showClearBtn();
            }
            this.Close();

        } else {
            if (!this.multi && window.innerWidth < 768) {
                this._SearchElem?.classList.remove('dp-custom-select-search-visible');
            }
            if (this.group && this._Input.value === this.value) {
                this._List?.querySelectorAll('div')?.forEach((item) => {
                    item.style.display = '';
                });
            }
            this.Open();
        }
    }

    /** Запрет на ввод в поле */
    private _readOnly(value: boolean) {
        this._readonly = value;
        if (value) {
            this._Input.readOnly = this.readonly;
            this._Input.setAttribute('placeholder', '');
        } else {
            this._Input.removeAttribute('readonly');
            this._Input.setAttribute('placeholder', 'Введите текст...');
        }
    }

    /**
     * Отключить или включить select
     * @param value - true || false
     */
    private _setEnable(value: boolean) {
        this._disabled = value;
        this._enable = !value;
        if (value) {
            this._Select.classList.add('dp-custom-select-enable');
            this._Input.setAttribute('disabled', 'disabled');
            this._Input.setAttribute('placeholder', '');
            this._Input.classList.add('dp-custom-select-input-enable');
            this._Button.setAttribute('disabled', 'disabled');
            this._Button.classList.add('dp-custom-select-btn-enable');
            if (this._ClearBtn) {
                this._ClearBtn.setAttribute('disabled', 'disabled');
                this._ClearBtn.classList.add('dp-custom-select-close-btn-enable');
            }
            this._Select.classList.remove('dp-custom-select-hover');
            this._Select.classList.remove('dp-custom-select-active-click');
            this._Select.classList.remove('dp-custom-select-active');
            this._Select.classList.remove('dp-custom-select-selected');
            this._disabledMultiSelect();
        } else {
            this._Select.classList.remove('dp-custom-select-enable');
            this._Button.removeAttribute('disabled');
            this._Button.classList.remove('dp-custom-select-btn-enable');
            this._Input.removeAttribute('disabled');
            this._Input.setAttribute('placeholder', 'Введите текст');
            this._Input.classList.remove('dp-custom-select-input-enable');
            if (this._ClearBtn) {
                this._ClearBtn.removeAttribute('disabled');
                this._ClearBtn.classList.remove('dp-custom-select-close-btn-enable');
            }
            this._disabledMultiSelect(false);
            this._Select.classList.add('dp-custom-select-hover');
            this._Select.classList.add('dp-custom-select-active-click');
        }
    }

    /** Блокируем или разблокируем выпадающей список с множественным выбором */
    private _disabledMultiSelect(disabled: boolean = true) {
        if (this.multi && this._MultiField) {
            const buttons = this._MultiField.querySelectorAll('.dp-custom-multiselect-value');
            if (buttons) {
                if (!disabled) {
                    for (let button of buttons) {
                        button.removeAttribute('disabled');
                        button.classList.remove('dp-custom-select-close-btn-enable');
                        button.lastElementChild?.removeAttribute('disabled');
                        button.lastElementChild?.classList.remove('dp-custom-select-close-btn-enable');
                    }
                } else {
                    for (let button of buttons) {
                        button.setAttribute('disabled', 'disabled');
                        button.classList.add('dp-custom-select-close-btn-enable');
                        button.lastElementChild?.setAttribute('disabled', 'disabled');
                        button.lastElementChild?.classList.add('dp-custom-select-close-btn-enable');
                    }
                }
            }
        }
    }

    /**
     * Устанавливаем значение
     * @param value - переданное значение
     */
    private _setValue(value: string | Array<any>) {
        if (typeof value === 'number') {
            value = String(value);
        }
        if (typeof value === 'string' && value) {
            if (typeof this._value === 'string') {
                this._value = value;
            }
            this._value = value;
            this._setValueForSelect(value);
        } else if (!value) {
            this._removeValue();
        } else {
            if (this.isRender) {
                this._removeValue();
            }
            this._value = value;
            this._setValueForMulti(value);
        }
    }

    /**
     * Устанавливаем значение для обычного списка
     * @param value - переданное значение
     */
    private _setValueForSelect(value: string) {
        if (this._treeList?.length) {
            const model = this._findItem(this._treeList, value);
            if (model) {
                const item = model.DataElement;
                if (item) {
                    const index = this.dataSource?.GetIndexById(model[this._dataValueField], this._dataValueField);
                    if (index || index === 0) {
                        if (this._multi) this.select = index;
                        if (!this._multi) this._select = index;
                    }

                    this._text = model[this._dataTextField];
                    this._Input.value = this._text;
                    if (this.tree || this.group) {
                        this._parent = model[this._dataParentIdField];
                    }

                    if (!this.multi) {
                        if (this._selected?.DataElement) {
                            this._selected.DataElement.dataset.selected = 'false';
                        }
                    }

                    item.dataset.selected = 'true';
                    this._selected = model;
                    this._showClearBtn();
                }
            } else {
                this._removeValue();
            }
        }
    }

    /**
     * Устанавливаем значение для списка со множественным выбором
     * @param values - массив переданных значений
     */
    private _setValueForMulti(values: any) {
        if (this.multi) {
            this._selected = [];
            if (typeof values === 'object') {
                for (let value of values) {
                    if (this._treeList?.length) {
                        const model = this._findItem(this._treeList, value);
                        if (model) {
                            const item = model.DataElement;
                            if (item) {
                                item.dataset.selected = 'true';
                                this._selected.push(model);
                                this._setValueMulti(item);
                            }
                        }
                    }
                }
            }
        }
    }

    /** Устанавливаем текст и передаем данные в SetValue для установки значения, если требуется */
    private _setText(text: string) {
        this._text = text;
        this._Input.value = text;
        if (!this.multi) {
            if (this._treeList?.length) {
                if (text !== '') {
                    const model = this._findItem(this._treeList, text, this._dataTextField);
                    if (model) {
                        this.value = String(model[this._dataValueField]);
                    }
                } else {
                    this.value = '';
                }
            }
        }
    }

    /**
     * Поиск элементов в списке, которые подходят под запрос
     * @param list - список
     * @param value - значение
     * @param param - параметр, по которому сравниваются элементы
     */
    private _findItem(list: Array<any>, value: string, param: string = this._dataValueField) {
        if (list.length) {
            for (let model of list) {
                if (String(model[param]) === value) {
                    return model;
                }
                if (model[this._dataChildrenField]) {
                    const foundItem: any = this._findItem(model[this._dataChildrenField], value);
                    if (foundItem) return foundItem;
                }
            }
        }
    }

    /** Подписываюсь на функции класса DPDataSource */
    private _getSubscription() {
        if (this.dataSource) {
            this.dataSource.onAdd = (model: any) => this._refreshAdd(model);
            this.dataSource.onRemove = (model: any) => this._refreshRemove(model);
        }
    }

    /**
     * Кастомные события
     * @param type - тип события
     */
    private _events(type: string) {
        this.dispatchEvent(new Event(`${type}`));
    }

    /** Отчистка массивов перед обновлением списка */
    private _resetProperties() {
        this._treeItems = {
            treeItem: [],
            treeButtons: []
        };
        this._treeLists = [];
        this._width = 0;
    }

    // #region public methods

    /** Обновление списка при поступлении новых данных */
    public SetData(data: DPDataSource) {
        if (this._dataSource?.data?.list) {
            this._removeValue();
        }
        this._dataSource = data;
        this._getSubscription();

        if (this.dataSource?.data?.list) {
            this._checkDataParams();
            this._handleList(this.dataSource.data.list);
            this._createList();
        } else if (this.dataSource?.data?.transport) {
            if (this.dataSource.data.transport.read) {
                this.dataSource.data.transport.read(() => {
                    if (this.dataSource?.data?.list?.length) {
                        this._checkDataParams();
                        this._handleList(this.dataSource.data.list);
                        this._createList();
                    }
                });
            }
        }
    }

    /** Открытие выпадающего списка */
    public Open() {
        this._isOpen = true;
        this._Select.classList.add('dp-custom-select-active');
        this._SelectWindow?.classList.remove('dp-custom-select-close');
        this._SelectWindow?.classList.add('dp-custom-select-open');
        setTimeout(() => {
            this._SelectWindow?.classList.add('dp-custom-select-open-height');
        }, 135);
        this._Button.classList.add('dp-custom-select-btn-open');
        this._Button.classList.remove('dp-custom-select-btn-close');
        if (window.innerWidth < 768) {
            this._Select.classList.add('dp-custom-select-background');
        }
        this._events('open');
        window.addEventListener('mousedown', this._closeAllWindows, { capture: true });
        if (this._isOpenMenu) {
            this._toggleMenu();
        }
    }

    /** Закрытие выпадающего списка */
    public Close() {
        this._isOpen = false;
        this._Select.classList.remove('dp-custom-select-active');
        this._Button.classList.add('dp-custom-select-btn-close');
        this._Button.classList.remove('dp-custom-select-btn-open');
        this._SelectWindow?.classList.remove('dp-custom-select-open');
        this._SelectWindow?.classList.add('dp-custom-select-close');
        setTimeout(() => {
            this._SelectWindow?.classList.remove('dp-custom-select-close');
        }, 135);
        if (window.innerWidth < 768) {
            this._Select.classList.remove('dp-custom-select-background');
        }
        this._events('close');
        if (this.text !== this._Input?.value) {
            this._resetValue();
        }
        window.removeEventListener('mousedown', this._closeAllWindows, { capture: true });
    }

    // #endregion public methods

    // #region set and get

    set dataSource(value: DPDataSource | null) {
        this._setProperty('dataSource', value);
    }

    set value(value: string | Array<any>) {
        this._setProperty('value', value);
    }

    set text(txt: string) {
        this._setProperty('text', txt);
    }

    set select(value: number) {
        this._setProperty('select', value);
    }

    set enable(value: boolean) {
        this._setProperty('enable', `${value}`);
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', `${value}`);
    }

    set readonly(value: boolean) {
        this._setProperty('readonly', `${value}`);
    }

    set search(value: boolean) {
        if (!this.isRender) {
            this._search = value;
        } else {
            throw new Error('Свойство search доступно только для чтения');
        }
    }

    set dataTextField(value: string) {
        if (!this.isRender) {
            this._dataTextField = value;
        } else {
            throw new Error('Свойство dataTextField доступно только для чтения');
        }
    }

    set dataValueField(value: string) {
        if (!this.isRender) {
            this._dataValueField = value;
        } else {
            throw new Error('Свойство dataValueField доступно только для чтения');
        }
    }

    set multi(value: boolean) {
        if (!this.isRender) {
            this._multi = value;
        } else {
            throw new Error('Свойство multi доступно только для чтения');
        }
    }

    set group(value: boolean) {
        if (!this.isRender) {
            this._group = value;
        } else {
            throw new Error('Свойство group доступно только для чтения');
        }
    }

    set tree(value: boolean) {
        if (!this.isRender) {
            this._tree = value;
        } else {
            throw new Error('Свойство tree доступно только для чтения');
        }
    }

    set clearButton(value: boolean) {
        if (!this.isRender) {
            this._clearButton = value;
        } else {
            throw new Error('Свойство clearButton доступно только для чтения');
        }
    }

    get enable() {
        return this._enable;
    }

    get disabled(): boolean {
        return this._disabled;
    }

    get value(): string | Array<any> {
        return this._value;
    }

    get text(): string {
        return this._text;
    }

    get search(): boolean {
        return this._search;
    }

    get dataTextField(): string {
        return this._dataTextField;
    }

    get dataValueField(): string {
        return this._dataValueField;
    }

    get select(): number {
        return this._select;
    }

    get readonly(): boolean {
        return this._readonly;
    }

    get multi(): boolean {
        return this._multi;
    }

    get data(): DPDataSource | null {
        return this._dataSource ? this._dataSource : null;
    }

    get dataSource(): DPDataSource | null {
        return this._dataSource ? this._dataSource : null;
    }

    get group(): boolean {
        return this._group;
    }

    get tree(): boolean {
        return this._tree;
    }

    get clearButton(): boolean {
        return this._clearButton;
    }

    get parent(): string | number {
        return this._parent;
    }

    get selected(): any {
        return this._selected;
    }

    get isOpen(): boolean {
        return this._isOpen;
    }

    // #endregion set and get
});

customElements.define('dataplat-tab', class DPTab extends HTMLElement {
    onSelect: Function | undefined;
    onState: Function | undefined;
    onResize: Function | undefined;
    onCreate: Function | undefined;
    onModal: Function | undefined;
    onDisabled: Function | undefined;
    onRemove: Function | undefined;
    isRender: boolean;

    public el: any;

    private _position: string;
    private _state: boolean;
    private _disabled: boolean;
    private _tab: string;
    private _select: any;
    private _main: string;
    private _mainOnly: boolean;
    private _modal: boolean;
    private _defaultName: string;
    private _dataSource: DPDataSource | null;
    private _dataActionField: string;
    private _dataTextField: string;
    private _dataIdField: string;
    private _tabProperties: Array<any>;
    private _noLayout: string;
    private _buttonType: string;
    control:
        | DPElements.TabTop
        | DPElements.TabLeft
        | DPElements.TabRight
        | DPElements.TabBottom
        | undefined;

    constructor() {
        super();
        this._position = 'top';
        this._state = true;
        this._disabled = false;
        this._tab = '';
        this._select = null;
        this._main = '';
        this._mainOnly = false;
        this._modal = false;
        this._defaultName = 'Новая вкладка';
        this._dataActionField = 'action';
        this._dataTextField = 'name';
        this._dataIdField = 'id';
        this._tabProperties = [];
        this._noLayout = 'Необходимо выбрать вкладку';
        this._buttonType = '';
        this._dataSource = null;
        this.isRender = false;
    }

    connectedCallback() {
        if (!this.isRender) {
            this.el = this;
            this.classList.add('dp-vertical-tabs-block');
            document.addEventListener('DOMContentLoaded', () => {
                this._propertyHandler();
                this._checkSchemaModel();
                this.isRender = true;
            });
        }
    }

    static get observedAttributes() {
        return ['select', 'state', 'disabled', 'main', 'mainonly', 'buttontype', 'tab'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'dataSource':
                if (newValue instanceof DPDataSource) {
                    this.control ? this.control.dataSource = newValue : this._dataSource = newValue;
                } else {
                    throw new Error('переданное значение для dataSource не ялвяется инстансом класса DPDataSource');
                }
                break;
            case 'tab':
                if (typeof newValue === 'string') {
                    this._tab = newValue;
                }
                break;
            case 'select':
                if (this.control) {
                    if (typeof newValue === 'string') {
                        this.control.tab = newValue;
                    } else {
                        this._setTab(newValue);
                    }
                }
                break;
            case 'state':
                if (this.control) {
                    if (typeof newValue === 'boolean') {
                        if (newValue !== this.control.state) {
                            this.control.state = newValue;
                        }
                    } else {
                        if (newValue === 'true') {
                            if (!this.control.state) {
                                this.control.state = true;
                            }
                        }
                        if (newValue === 'false') {
                            if (this.control.state) {
                                this.control.state = false;
                            }
                        }
                    }
                }
                break;
            case 'disabled':
                if (this.control) {
                    if (typeof newValue === 'boolean') {
                        this.control.disabled = newValue;
                    } else {
                        if (newValue === 'true') {
                            this.control.disabled = true;
                        }
                        if (newValue === 'false') {
                            this.control.disabled = false;
                        }
                    }
                }
                break;
            case 'mainonly':
            case 'mainOnly':
                if (this.control) {
                    if (typeof newValue === 'boolean') {
                        this.control.mainOnly = newValue;
                    } else {
                        if (newValue === 'true') {
                            this.control.mainOnly = true;
                        }
                        if (newValue === 'false') {
                            this.control.mainOnly = false;
                        }
                    }
                }
                break;
            case 'buttonType':
            case 'buttontype':
                if (this.control) this.control.buttonType = newValue;
                break;
            default:
                break;
        }
    }

    /** Проверка на наличие модели в схеме dataSource */
    private _checkSchemaModel() {
        if (this._dataSource?.data?.schema?.model) {
            this._dataIdField = this._dataSource.idParam;
            this._handlerModelProperty(this._dataSource.data.schema.model);
        } else {
            if (this._dataSource?.data) {
                this._dataSource.data.schema = this._getSchema();
                this._dataSource.Schema();
            }
        }
    }

    /**
     * Обработка свойств модели данных
     * @param model - модель данных
     */
    private _handlerModelProperty(model: any) {
        if (model.name) this._dataTextField = model.name;
    }

    /**
     * Получение схемы для dataSource
     * @param model - модель данных
     */
    private _getSchema(model?: any) {
        if (model?.id) this._dataIdField = model.id;
        return {
            model: {
                id: this._dataIdField
            }
        };
    }

    private _propertyHandler() {
        this._handlerParams();

        if (this.tab) {
            let value = this.tab;
            this._tabHandler(value.toString());
        } else if (this.getAttribute('tab')) {
            let value = this.getAttribute('tab');
            if (value) this._tabHandler(value);
        }

        DPElements.Global.CheckProperty(this, 'tab', false);

        if (!this.state) {
            let value = this.state;
            if (!value) {
                this.state = value;
            }
        } else if (this.getAttribute('state')) {
            let value = this.getAttribute('state');
            if (value === 'false') {
                this.state = false;
            }
        }

        DPElements.Global.CheckProperty(this, 'state');

        this._handlerProperty();
    }

    /** Обработка параметров */
    private _handlerParams() {
        DPElements.Global.CheckProperty(this, 'dataSource');

        DPElements.Global.CheckProperty(this, 'main', false);
        DPElements.Global.CheckProperty(this, 'dataTextField', false);
        DPElements.Global.CheckProperty(this, 'dataActionField', false);
        DPElements.Global.CheckProperty(this, 'dataIdField', false);
        DPElements.Global.CheckProperty(this, 'modal', false);
        DPElements.Global.CheckProperty(this, 'defaultName', false);
        DPElements.Global.CheckProperty(this, 'noLayout', false);
    }

    /** Обработка свойств */
    private _handlerProperty() {
        DPElements.Global.CheckProperty(this, 'disabled');
        DPElements.Global.CheckProperty(this, 'mainOnly');
        DPElements.Global.CheckProperty(this, 'buttonType');
        DPElements.Global.CheckProperty(this, 'select');
    }

    private _tabHandler(value: string) {
        switch (value) {
            case 'top':
                this._position = value;
                this.control = new DPElements.TabTop(this.el);
                break;
            case 'left':
                this._position = value;
                this.control = new DPElements.TabLeft(this.el);
                break;
            case 'right':
                this._position = value;
                this.control = new DPElements.TabRight(this.el);
                break;
            case 'bottom':
                this._position = value;
                this.control = new DPElements.TabBottom(this.el);
                break;
            default:
                break;
        }
        if (this.control) {
            this.control.onSelect = (action: string) => this._onSelectEvent(action);
            this.control.onDisabled = (value: boolean) => this._onDisabledEvent(value);
            if (this.control instanceof DPElements.TabLeft || this.control instanceof DPElements.TabRight) {
                this.control.onState = (state: boolean) => this._onStateEvent(state);
                this.control.onResize = (e: Event) => this._onResizeEvent(e);
                this.control.onModal = (action: string) => this._onModalEvent(action);
            }
            if (this.control instanceof DPElements.TabBottom) {
                this.control.onCreate = (action: string) => this._onCreateEvent(action);
                this.control.onRemove = (action: string) => this._onRemoveEvent(action);
            }
        }
    }

    private _setSelectedModel(action: string) {
        if (this.dataSource?.data) {
            this._select = this.dataSource.data.list.find((model: any) => model.action === action);
        } else {
            this._select = this.el._tabProperties.find((model: any) => model.action === action);
        }
    }

    /**
     * Событие изменения состояния вкладок
     * @param action - парметр data-action удаленной вкладки
     */
    private _onRemoveEvent(action: string) {
        if (typeof this.onRemove === 'function') {
            this.onRemove.call(this, this);
        }

        let newEvent = new CustomEvent('remove', {
            detail: {
                that: this,
                action: action
            }
        });
        this.dispatchEvent(newEvent);
    }

    /**
     * Событие изменения состояния вкладок
     * @param value
     */
    private _onDisabledEvent(value: boolean) {
        this._disabled = value;
        if (typeof this.onDisabled === 'function') this.onDisabled.call(this, this);

        let newEvent = new CustomEvent('disabled', {
            detail: { that: this }
        });
        this.dispatchEvent(newEvent);
    }

    /**
     * Событие изменения состояния модального окна
     * @param action - парметр data-action модального окна
     */
    private _onModalEvent(action: string) {
        if (typeof this.onModal === 'function') this.onModal.call(this, this);


        let newEvent = new CustomEvent('modal', {
            detail: {
                that: this,
                action: action
            }
        });
        this.dispatchEvent(newEvent);
    }

    /**
     * Событие создания новой вкладки
     * @param action - парметр data-action созданной вкладки
     */
    private _onCreateEvent(action: string) {
        this._setSelectedModel(action);
        if (typeof this.onCreate === 'function') this.onCreate.call(this, this);

        let newEvent = new CustomEvent('create', {
            detail: {
                that: this,
                model: action
            }
        });
        this.dispatchEvent(newEvent);
    }

    /**
     * Событие выбранной вкладки
     * @param action - парметр data-action выбранной вкладки
     */
    private _onSelectEvent(action: string) {
        this._setSelectedModel(action);
        this._tab = action;
        if (typeof this.onSelect === 'function') this.onSelect.call(this, this);

        let newEvent = new CustomEvent('select', {
            detail: {
                that: this,
                model: action
            }
        });
        this.dispatchEvent(newEvent);
    }

    /**
     * Событие изменения состояния, открытое или закрытое
     * @param state - событие
     */
    private _onStateEvent(state: boolean) {
        this._state = state;
        if (typeof this.onState === 'function') {
            this.onState.call(this, this);
        }
        let newEvent = new CustomEvent('state', {
            detail: { that: this }
        });
        this.dispatchEvent(newEvent);
    }

    /**
     * Событие изменение размера
     * @param event - событие
     */
    private _onResizeEvent(event: Event) {
        if (typeof this.onResize === 'function') this.onResize.call(this, this);

        let newEvent = new CustomEvent('resize', {
            detail: {
                that: this,
                event: event
            }
        });
        this.dispatchEvent(newEvent);
    }

    /**
     * Отключить или включить вкладку
     * @param model - модель элемента, который необходимо сделать активным
     */
    private _setTab(model: TabProperties) {
        const activeTab = this.tabProperties.find((item: any) => item.action === model.action && item.active !== model.active);
        if (activeTab && model.active) {
            if (this.control) this.control.tab = activeTab.action;
        } else {
            const disabled = this.tabProperties.find((item: any) => item.action === model.action && item.disabled !== model.disabled);
            if (disabled) {
                this.DisabledTab(model.action, model.disabled);
            }
        }
    }

    /* #region публичные методы */
    /**
     * Отключить или включить вкладку
     * @param action - вкладка
     * @param result - true - если отключить вкладку, false если включить вкладку
     */
    public DisabledTab(action: string, result: boolean) {
        if (this.control) this.control.DisabledTab(action, result);
    }

    public Add(model: any, el: string | HTMLElement) {
        if (this.control instanceof DPElements.TabBottom) {
            this.control.Add(model, el);
        }
    }

    public GetContent(id: string) {
        const model = this.dataSource?.GetById(id);
        if (model) {
            const contentContainer = this.el.querySelector('.dp-bottom-tab-contents');
            if (contentContainer) {
                return contentContainer.querySelector(`[data-action="${model.action}"]`);
            }
        }
    }

    /* #endregion публичные методы */

    /* #region set and get */

    set dataSource(value: DPDataSource | null) {
        this._setProperty('dataSource', value);
    }

    set state(value: boolean) {
        this._setProperty('state', value);
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', value);
    }

    set mainOnly(value: boolean) {
        this._setProperty('mainOnly', value);
    }

    set buttonType(value: string) {
        this._setProperty('buttonType', value);
    }

    set select(value: string | TabProperties) {
        this._setProperty('select', value);
    }

    set tab(value: string) {
        if (!this.isRender) {
            this._tab = value;
        }
    }

    set modal(value: boolean) {
        if (!this.isRender) {
            this._modal = value;
        }
    }

    set dataActionField(value: string) {
        if (!this.isRender) {
            this._dataActionField = value;
        }
    }

    set dataTextField(value: string) {
        if (!this.isRender) {
            this._dataTextField = value;
        }
    }

    set main(value) {
        if (!this.isRender) {
            this._main = value;
        }
    }

    set defaultName(value: string) {
        if (!this.isRender) {
            this._defaultName = value;
        }
    }

    set noLayout(value: string) {
        if (!this.isRender) {
            this._noLayout = value;
        }
    }

    set dataIdField(value: string) {
        if (!this.isRender) {
            this._dataIdField = value;
        }
    }

    get dataIdField(): string {
        return this._dataIdField;
    }

    get dataSource(): DPDataSource | null {
        return this._dataSource ? this._dataSource : null;
    }

    get position(): string {
        return this._position;
    }

    get tabProperties() {
        return this._tabProperties;
    }

    get modal() {
        return this._modal;
    }

    get dataActionField() {
        return this._dataActionField;
    }

    get dataTextField() {
        return this._dataTextField;
    }

    get main() {
        return this._main;
    }

    get tab() {
        return this._tab;
    }

    get state() {
        return this._state;
    }

    get disabled() {
        return this._disabled;
    }

    get mainOnly() {
        return this._mainOnly;
    }

    get defaultName() {
        return this._defaultName;
    }

    get noLayout() {
        return this._noLayout;
    }

    get buttonType() {
        return this._buttonType;
    }

    get select(): any {
        return this._select;
    }

    /* #endregion */
});

customElements.define("dataplat-accordion-list", class DataplatAccordionList extends HTMLElement {
    private _buttons: Array<HTMLButtonElement>;
    private _mainList: HTMLUListElement | undefined | null;
    private _dataSource: DPDataSource | undefined | null;
    private _selectedButton: HTMLButtonElement | undefined | null;
    private _selected: any;
    private _selectedId: string;
    private _mode: string;
    private _lists: Array<HTMLElement>;
    private _listItems: Array<HTMLElement>;
    private _textParagraphs: Array<HTMLParagraphElement>;
    private _icons: Array<SVGSVGElement | HTMLImageElement>;
    private _subLists: Array<HTMLElement>;
    private _groupButtons: Array<HTMLElement>;
    private _hasPrevSibling: boolean;
    private _hasNextSibling: boolean;
    private _position: any;

    private _dataTextField: string;
    private _dataValueField: string;
    private _dataIconField: string;
    private _dataIsGroupField: string;
    private _dataParentIdField: string;

    public isRender: boolean;

    private _nullGuid: string;

    constructor() {
        super();

        this._buttons = [];
        this._mainList = null;
        this._dataSource = null;
        this._selectedButton = null;
        this._selected;
        this._selectedId = "";
        this._mode = "";
        this._lists = [];
        this._listItems = [];
        this._textParagraphs = [];
        this._icons = [];
        this._subLists = [];
        this._groupButtons = [];
        this._hasPrevSibling = false;
        this._hasNextSibling = false;
        this._position = { up: false, down: false };

        this._dataTextField = "name";
        this._dataValueField = "id";
        this._dataIconField = "icon";
        this._dataIsGroupField = "isGroup";
        this._dataParentIdField = "parentId";

        this.isRender = false;

        this._nullGuid = "00000000-0000-0000-0000-000000000000";
    }

    connectedCallback() {
        const readyState = document.readyState!;

        if (readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this._checkIsRendered());
        } else {
            this._checkIsRendered();
        }
    }

    static get observedAttributes() {
        return ["mode"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue?: string) {
        switch (name) {
            case "mode":
                this._setMode(newValue);
                break;
            case "dataSource":
                if (newValue instanceof DPDataSource) {
                    this._setData(newValue);
                }
                break;
            case "selected":
                this._setSelected(newValue);
                break;
            case "selectedId":
                this._setSelectedId(newValue);
                break;
        }
    }

    /**
     * @param value - новое значение атрибута mode
     * @private переключаем  аккордеон в режим, присвоенный в атрибуте "mode"
     */
    private _setMode(value: string) {
        this._mode = value;
        if (this._mode === "icons") {
            if (!this._icons.length || !this._textParagraphs.length) {
                return;
            }
            for (let list of this._lists) {
                list.classList.add("dp-accordion-list-icons");
            }
            for (let button of this._buttons) {
                if (this._groupButtons.indexOf(button) === -1) {
                    button.classList.add("dp-accordion-btn-icons");
                }
            }
            for (let icon of this._icons) {
                icon.dataset.visible = "true";
            }
            for (let text of this._textParagraphs) {
                const parentButton = text.parentElement as HTMLButtonElement;
                const hasChildrenButton = this._groupButtons.indexOf(parentButton) !== -1;

                if (!hasChildrenButton) {
                    text.dataset.visible = "false";
                }
            }
        } else if (this._mode === "text") {
            if (!this._icons.length || !this._textParagraphs.length) {
                return;
            }
            for (let list of this._lists) {
                list.classList.remove("dp-accordion-list-icons");
            }
            for (let button of this._buttons) {
                button.classList.remove("dp-accordion-btn-icons");
            }
            for (let text of this._textParagraphs) {
                text.dataset.visible = "true";
            }
            for (let icon of this._icons) {
                icon.dataset.visible = "false";
            }
        } else {
            if (!this._icons.length || !this._textParagraphs.length) {
                return;
            }
            for (let list of this._lists) {
                list.classList.remove("dp-accordion-list-icons");
            }
            for (let button of this._buttons) {
                button.classList.remove("dp-accordion-btn-icons");
            }
            for (let text of this._textParagraphs) {
                text.dataset.visible = "true";
            }
            for (let icon of this._icons) {
                icon.dataset.visible = "true";
            }
        }
    }

    /**
     * @private задаем новое значение выбранной модели и кнопки
     * @param value - id модели или сама модель-объект
     */
    private _setSelected(value: string | any) {
        if (typeof value === "string") {
            this._selected = this.dataSource!.GetById(value);
        } else if (typeof value === "object") {
            this._selected = value;
        }

        this._selectedButton = this._buttons.find(
            (button) => button.dataset.uid === this._selected.uid
        );
        this._addSelectedButtonClasses();
        this._dispatchChangedEvent();
    }

    /**
     * @private задаем новое значение кнопки, которую нужно выбрать сразу после рендера
     * @param value - id модели
     */
    private _setSelectedId(value: string) {
        this._selectedId = value;
    }

    /**
     * @private проверка перед рендером
     * нужна для избежания повторных рендеров компонента по той или иной ситуации
     */
    private _checkIsRendered() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private рендер аккордеона
     */
    private _render() {
        this.classList.add('dp-accordion-list');
        this._checkProperties();
        const buttons: Array<HTMLButtonElement> = [...this.querySelectorAll("button")];
        const buttonModels: any[] = [];
        const children = [...this.children] as Array<HTMLUListElement>;
        const list = children[0] as HTMLUListElement;

        if (!this._dataSource) {
            if (list) {
                const listItems = [...list.children] as Array<HTMLLIElement>;
                this._buttons = buttons;
                this._mainList = list;

                if (this._buttons.length > 0) {
                    this._getButtonModels(this._buttons, buttonModels);

                    this._dataSource = new DPDataSource({
                        list: buttonModels,
                        schema: {
                            model: {
                                name: this._dataTextField,
                                icon: this._dataIconField,
                                id: this._dataValueField,
                                parentId: this._dataParentIdField,
                                isGroup: this._dataIsGroupField,
                            },
                        },
                    });

                    this._setButtonsUids(this._buttons);
                    this._setButtonsParentIds(this._buttons);

                    if (list) {
                        this._lists.push(list);
                    }

                    if (!list || !listItems) {
                        return;
                    }

                    for (let li of listItems) {
                        this._addChildrenClasses(li);
                    }

                    this._setInitialMode();
                    this._getSubscription();
                    this.CollapseAll();
                    this._setSelectedButton();
                }
            }
        } else {
            this._renderNewData();
        }

        this._addEventListeners();
        this._dispatchLoadedEvent();
    }

    /**
     * @private получение значений атрибутов
     */
    private _checkProperties() {
        DPElements.Global.CheckProperty(this, "mode");
        DPElements.Global.CheckProperty(this, "dataValueField", false, false);
        DPElements.Global.CheckProperty(this, "dataTextField", false, false);
        DPElements.Global.CheckProperty(this, "dataIconField", false, false);
        DPElements.Global.CheckProperty(this, "dataIsGroupField", false, false);
        DPElements.Global.CheckProperty(this, "dataParentIdField", false, false);
        DPElements.Global.CheckProperty(this, "selectedId");
        DPElements.Global.CheckProperty(this, "dataSource");
    }

    /**
     * @param buttons - массив всех кнопок в аккордеоне
     * @param buttonModels -массив моделей всех кнопок
     * @private формирование массива моделей кнопок
     */
    private _getButtonModels(buttons: Array<HTMLButtonElement>, buttonModels: Array<any>) {
        for (let button of buttons) {
            const buttonModel = {} as any;
            const subList =
                button.nextElementSibling?.nodeName === "UL" ? button.nextElementSibling : null;
            const icon =
                button.querySelector("svg")?.querySelector("use") ||
                (button.querySelector("img") as HTMLImageElement | SVGUseElement);
            const text = button.querySelector("p");

            if (subList) {
                buttonModel[this._dataIsGroupField] = true;
            }
            if (icon) {
                if (icon.nodeName === "use") {
                    const svgUseIcon = icon as SVGUseElement;
                    const string = svgUseIcon.href.baseVal;
                    const startingIndex = string.indexOf("#") + 1;

                    buttonModel[this._dataIconField] = string.split("").splice(startingIndex).join("");
                } else {
                    const imgIcon = icon as HTMLImageElement;
                    buttonModel[this._dataIconField] = imgIcon.src;
                }
            }
            buttonModel[this._dataTextField] = text?.textContent || button.textContent;

            if (!button.dataset.value) {
                const value = DPElements.Global.NewGuid();
                buttonModel[this._dataValueField] = value;
                button.dataset.value = value;
            } else {
                buttonModel[this._dataValueField] = button.dataset.value;
            }

            buttonModels.push(buttonModel);
        }
    }

    /**
     * @private присваиваем кнопкам data-uid
     * @param buttons массив HTMLButtonElement
     */
    private _setButtonsUids(buttons: Array<HTMLButtonElement>) {
        for (let button of buttons) {
            const list = this._dataSource!.data.list;
            button.dataset.uid = list.find(
                (model: any) => model[this._dataValueField] === button.dataset.value
            ).uid;
        }
    }

    /**
     * @private присваиваем кнопкам и их моделям parentId
     * @param buttons массив HTMLButtonElement
     */
    private _setButtonsParentIds(buttons: Array<HTMLButtonElement>) {
        for (let button of buttons) {
            const parentButton = button!.parentElement!.parentElement
                ?.previousElementSibling as HTMLButtonElement;

            const isChildButton = this._buttons.indexOf(parentButton) !== -1;

            if (isChildButton) {
                const list = this._dataSource?.data.list;
                const model = list.find(
                    (model: any) => model[this._dataValueField] === button.dataset.value
                );
                model[this._dataParentIdField] = parentButton.dataset.value;
                button.dataset.parentId = parentButton.dataset.value;
            }
        }
    }

    /**
     * @param listItem - элемент списка
     * @private добавление классов и слушателей событий дочерним элементам аккордеона
     */
    private _addChildrenClasses(listItem: HTMLLIElement) {
        this._listItems.push(listItem);
        listItem.classList.add("dp-group-list-item");
        const liChildren = [...listItem.children] as Array<HTMLLIElement>;

        const button = liChildren.find((child: HTMLElement) => {
            return child.tagName === "BUTTON";
        });
        const subList = liChildren.find((child: HTMLElement) => {
            return child.tagName === "UL";
        });
        if (subList) {
            this._lists.push(subList);
        }

        if (button) {
            button.classList.add("dp-item-blue");

            const icon = button.querySelector("svg") || button.querySelector("img");
            const text = button.querySelector("p");
            if (icon) {
                icon.classList.add("dp-icon-button-svg");
                this._icons.push(icon);
            }
            if (text) {
                this._textParagraphs.push(text);
            }

            if (icon && text) {
                button.classList.add("dp-accordion-btn");
                text.classList.add("dp-accordion-text");
            }
        }

        if (button && subList) {
            this._subLists.push(subList);
            this._groupButtons.push(button);

            subList.classList.add("dp-group-items");
            button.classList.add("dp-item-main", "dp-is-group");
            button?.parentElement?.classList.add("dp-accordion-list-item-main");

            const subChildren = [...subList.children] as Array<HTMLLIElement>;

            for (let subChild of subChildren) {
                this._addChildrenClasses(subChild);
            }
        }
    }

    /**
     * @private добавление слушателей событий
     */
    private _addEventListeners() {
        this.addEventListener("click", (e: MouseEvent) => {
            this._handleClick(e);
        });

        this.addEventListener("contextmenu", (e: MouseEvent) => {
            this._handleContextMenu(e);
        });
    }

    /**
     * @param e - Event
     * @private обработка клика по аккордеону
     */
    private _handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const button = target.closest(".dp-item-blue") as HTMLButtonElement;

        if (button?.disabled) {
            return;
        }

        const isButton = this._buttons.indexOf(button) !== -1;
        const isGroupButton = this._groupButtons.indexOf(button) !== -1;

        if (isButton) {
            const prevSelectedButton = this._selectedButton;
            this._selectedButton = button;

            if (prevSelectedButton !== this._selectedButton) {
                this._handleButtonClick(button);
            }
        }

        if (isGroupButton) {
            this._handleGroupButtonClick(button);
        }

        this._removeNotSelectedButtonClasses();
    }

    /**
     * @param button - кнопка аккордеона
     * @private присваиваем нажатую кнопку в this._selectedButton для дальнейших манипуляций
     */
    private _handleButtonClick(button: HTMLButtonElement) {
        const uid = button.dataset.uid as string;
        this._selected = this._dataSource!.GetByUid(uid);

        this._checkUpAndDown(this._selected[this._dataValueField]);

        this._dispatchChangedEvent();

        this._addButtonClasses();
    }

    /**
     * @private создаем событие dataload
     */
    private _dispatchDataLoadEvent() {
        const eventDataLoad = new Event("dataload", { bubbles: true });

        this.dispatchEvent(eventDataLoad);
    }

    /**
     * @private создаем событие loaded
     */
    private _dispatchLoadedEvent() {
        const eventLoaded = new Event("loaded", {
            bubbles: true,
        });

        this.dispatchEvent(eventLoaded);
    }

    /**
     * @private создаем событие changed
     */
    private _dispatchChangedEvent(e?: MouseEvent) {
        const eventChanged = new Event("changed", {
            bubbles: true,
        });

        this.dispatchEvent(eventChanged);
    }

    /**
     * @private создаем событие position
     */
    private _dispatchPositionEvent() {
        const eventChanged = new Event("position", {
            bubbles: true,
        });

        this.dispatchEvent(eventChanged);
    }

    /**
     * @private присваиваем нажатой кнопке и ее родительской кнопке классы
     * удаляем эти классы у других кнопок
     */
    private _addSelectedButtonClasses() {
        this._handleButtonClick(this._selectedButton!);

        const isGroupButton = this._groupButtons.indexOf(this._selectedButton!) !== -1;

        if (isGroupButton) {
            this._handleGroupButtonClick(this._selectedButton!);
        }

        this._removeNotSelectedButtonClasses();
    }

    /**
     * @private добавляем классы выбранной/нажатой кнопке
     */
    private _addButtonClasses() {
        this._selectedButton!.classList.add("active");

        const hasParent =
            this._selected[this._dataParentIdField] &&
            this._selected[this._dataParentIdField] !== this._nullGuid;

        if (hasParent) {
            const parentButton = this._buttons.find(
                (button) => button.dataset.value === this._selected[this._dataParentIdField]
            ) as HTMLButtonElement;

            this._addParentButtonClasses(parentButton);
        }
    }

    /**
     * @param button - кнопка с саблистом, по которой происходит клик
     * @private скрываем/показываем список под кнопкой
     */
    private _handleGroupButtonClick(button: HTMLButtonElement) {
        const subList =
            button.nextElementSibling?.nodeName === "UL"
                ? (button.nextElementSibling as HTMLUListElement)
                : null;

        if (!button || !subList) {
            return;
        }
        this._addGroupButtonClasses(button, subList);
    }

    /**
     * удаляем классы всем кнопкам, кроме выбранной/нажатой
     */
    private _removeNotSelectedButtonClasses() {
        for (let button of this._buttons) {
            if (button.dataset.uid !== this._selected.uid) {
                button.classList.remove("active");
            }

            if (button.dataset.value !== this._selected[this._dataParentIdField]) {
                button.classList.remove("inner");
            }
        }
    }

    /**
     * @private добавляем/удаляем классы кнопке с детьми и ее соседнему саблисту
     * @param button - нажатая кнопка HTMLButtonElement
     * @param subList - соседний HTMLUListElement нажатой кнопки
     */
    private _addGroupButtonClasses(button: HTMLButtonElement, subList: HTMLUListElement) {
        if (!button.classList.contains("is-open")) {
            button.classList.add("is-open");
            subList.classList.add("active");
        } else {
            button.classList.remove("is-open");
            subList.classList.remove("active");
        }
    }

    /**
     * @private добавляем классы родительской кнопке и саблисту, в котором находится кнопка, по которой произошел клик
     * @param parentButton - родительская кнопка кнопки, по которой произошел клик
     */
    private _addParentButtonClasses(parentButton: HTMLButtonElement) {
        const subList =
            parentButton!.nextElementSibling?.nodeName === "UL"
                ? parentButton!.nextElementSibling
                : null;

        parentButton!.classList.add("inner");
        parentButton!.classList.add("is-open");

        if (subList) {
            subList.classList.add("active");
        }
    }

    /**
     * @private создаем  событие при клике правой кнопкой по аккордеону
     * @param e - MouseEvent
     */
    private _handleContextMenu(e: MouseEvent) {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const button = target.closest(".dp-item-blue") as HTMLButtonElement;

        if (button && button.disabled) {
            return;
        }

        const uid = button.dataset.uid as string;
        this._selected = this._dataSource!.GetByUid(uid);

        this._dispatchContextEvent();
    }

    /**
     * @private создаем событие "context"
     */
    private _dispatchContextEvent() {
        const eventContext = new Event("context", {
            bubbles: true,
        });

        this.dispatchEvent(eventContext);
    }

    /**
     * @private переключаем  аккордеон в режим, изначально присвоенный в атрибуте "mode"
     */
    private _setInitialMode() {
        if (this._mode === "icons") {
            if (!this._icons.length || !this._textParagraphs.length) {
                return;
            }

            for (let text of this._textParagraphs) {
                const parentButton = text.parentElement as HTMLButtonElement;
                const hasChildrenButton = this._groupButtons.indexOf(parentButton) !== -1;

                if (!hasChildrenButton) {
                    text.dataset.visible = "false";
                }
            }

            for (let list of this._lists) {
                list.classList.add("dp-accordion-list-icons");
            }

            for (let button of this._buttons) {
                if (this._groupButtons.indexOf(button) === -1) {
                    button.classList.add("dp-accordion-btn-icons");
                }
            }
        } else if (this._mode === "text") {
            if (!this._icons.length || !this._textParagraphs.length) {
                return;
            }
            for (let icon of this._icons) {
                icon.dataset.visible = "false";
            }
        }
    }

    /**
     * @private Подписываюсь на функции класса DPDataSource
     */
    private _getSubscription() {
        this.dataSource!.onEdit = (model: any) => this._editItem(model);
        this.dataSource!.onAdd = (model: any) => this._addItem(model);
        this.dataSource!.onRemove = (model: any) => this._removeItem(model);
        this.dataSource!.onSort = (list: Array<any>) => this.SortItems(list);
    }

    /**
     * @param data - новые данные
     * @private обновление данных
     */
    private _setData(data: DPDataSource) {
        this._dataSource = data;
        if (!this.isRender) {
            return;
        }

        this._renderNewData();
    }

    /**
     * @private рендерим новые данные
     */
    private _renderNewData() {
        const list = this.dataSource!.data.list;

        if (this!.dataSource!.data.list) {
            this._getList(list);
        } else if (this.dataSource!.data.transport) {
            if (this.dataSource!.data.transport.read) {
                this.dataSource!.data.transport.read(() => {
                    this._getList(list);
                });
            }
        }

        this._getSubscription();
        this.CollapseAll();
        this._setSelectedButton();
        this._setMode(this._mode);
        this._dispatchDataLoadEvent();
    }

    /**
     * @param list - массив моделей кнопок
     * @private рендер новых кнопок по пришедшему списку
     */
    private _getList(list: Array<any>) {
        const itemsTree = this._getTreeFromList(list);

        this._buttons = [];
        this._groupButtons = [];
        this._lists = [];
        this._subLists = [];
        this._icons = [];
        this._textParagraphs = [];
        this._selectedButton = undefined;
        this.innerHTML = "";
        this._mainList = document.createElement("ul");

        this.append(this._mainList);
        this._lists.push(this._mainList);

        for (let item of itemsTree) {
            const listItem = document.createElement("li");
            const button = this._createButton(item);

            this._listItems.push(listItem);
            listItem.classList.add("dp-group-list-item");
            listItem.append(button);
            this._mainList.append(listItem);

            let isGroup = false;

            if (item.hasOwnProperty(this._dataIsGroupField)) {
                isGroup = item[this._dataIsGroupField];
            } else if (
                !item[this._dataParentIdField] ||
                item[this._dataParentIdField] === this._nullGuid
            ) {
                isGroup = true;
            }

            if (isGroup) {
                listItem.classList.add("dp-accordion-list-item-main");

                const subList = document.createElement("ul");
                subList.classList.add("dp-group-items");
                this._lists.push(subList);
                this._subLists.push(subList);

                listItem.appendChild(subList);

                if (!item.children) {
                    continue;
                }

                button.classList.add("dp-is-group");

                for (let subItem of item.children) {
                    const subListItem = document.createElement("li");
                    this._listItems.push(subListItem);
                    subListItem.classList.add("dp-group-list-item");

                    const subButton = this._createButton(subItem);

                    subListItem.append(subButton);
                    subList.append(subListItem);
                }
            }
        }
    }

    /**
     * @param array - массив моделей кнопок
     * @private формирует древовидный список элементов. в свойстве children хранятся дети элемента, если они есть
     * @returns массив элементов - детей корневого списка
     */
    private _getTreeFromList(array: Array<any>) {
        let roots = [] as Array<any>;
        let children = {} as any;

        for (let item of array) {
            if (!item[this._dataParentIdField] || item[this._dataParentIdField] === this._nullGuid) {
                roots.push(item);
            } else {
                if (children[item[this._dataParentIdField]]) {
                    children[item[this._dataParentIdField]].push(item);
                } else {
                    children[item[this._dataParentIdField]] = [item];
                }
            }
        }

        for (let root of roots) {
            this._findChildren(root, children);
        }

        return roots;
    }

    /**
     * @param root - элемент корневого списка
     * @param children - объект, в свойствах которого хранится массив детей элементов
     * [ключ - uid родителя]: значение массив детей, parentId которых равен ключу
     * @private ищет в параметре children ключ равный свойству uid параметра parent.
     * при успехе, присваивает массив детей в свойство children параметра parent.
     */
    private _findChildren(root: any, children: any) {
        let isGroup = false;

        if (root.hasOwnProperty(this._dataIsGroupField)) {
            isGroup = root[this._dataIsGroupField];
        } else if (
            !root[this._dataParentIdField] ||
            root[this._dataParentIdField] === this._nullGuid
        ) {
            isGroup = true;
        }

        if (!isGroup) {
            return;
        }

        if (children[root[this._dataValueField]]) {
            root.children = children[root[this._dataValueField]];
        }
    }

    /**
     * @param model
     * @private редактирование элемента
     */
    private _editItem(model: any) {
        const list = this._dataSource!.data.list;
        if (this._selectedButton!.dataset!.value !== model[this._dataValueField]) {
            this._selectedButton = this._buttons.find((button) => {
                return button.dataset.value === model[this._dataValueField];
            });
        }
        let selectedItem = list.find(
            (model: any) => model[this._dataValueField] === this._selectedButton!.dataset.value
        );
        selectedItem = { ...selectedItem, ...model };

        this._updateButton(model, selectedItem);
    }

    /**
     * @param updatedModel - новые данные элемента
     * @param selectedModel - редактируемый элемент
     * @private обновление кнопки
     */
    private _updateButton(updatedModel: any, selectedModel: any) {
        if (updatedModel.hasOwnProperty(this._dataIconField)) {
            const oldIcon =
                this._selectedButton!.querySelector("svg") ||
                (this._selectedButton!.querySelector("img") as SVGUseElement | HTMLImageElement);

            const isSpriteIcon = !updatedModel[this._dataIconField].includes("base64");
            if (isSpriteIcon) {
                const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

                use.setAttributeNS(
                    "http://www.w3.org/1999/xlink",
                    "href",
                    `/images/svg/dpicons.svg#${updatedModel[this._dataIconField]}`
                );

                icon.classList.add("dp-icon-button-svg");
                icon.append(use);
                if (oldIcon) {
                    oldIcon.parentElement!.replaceChild(icon, oldIcon);
                } else {
                    this._selectedButton!.classList.add("dp-accordion-btn");
                    this._selectedButton!.prepend(icon);
                }
            } else {
                const icon = document.createElement("img");
                icon.classList.add("dp-icon-button-svg");
                icon.src = updatedModel[this._dataIconField];

                if (oldIcon) {
                    oldIcon.parentElement!.replaceChild(icon, oldIcon);
                } else {
                    this._selectedButton!.classList.add("dp-accordion-btn");
                    this._selectedButton!.prepend(icon);
                }
            }
        }

        if (updatedModel.hasOwnProperty(this._dataTextField)) {
            if (selectedModel[this._dataIconField]) {
                const text = this._selectedButton!.querySelector("p");
                const newText = document.createElement("p");
                newText.textContent = selectedModel[this._dataTextField];
                if (text) {
                    this._selectedButton!.replaceChild(newText, text);
                } else {
                    this._selectedButton!.textContent = "";
                    this._selectedButton!.append(newText);
                }
            } else {
                this._selectedButton!.textContent = updatedModel[this._dataTextField];
            }
        }
    }

    /**
     * @param model - новый элемент
     * @private добавление нового элемента
     */
    private _addItem(model: any) {
        const newButton = this._createButton(model);
        const listItem = document.createElement("li");
        this._listItems.push(listItem);

        if (this._selectedButton?.dataset!.value !== model[this._dataParentIdField]) {
            this._selectedButton = this._buttons.find((button) => {
                return button.dataset.value === model[this._dataParentIdField];
            });
        }

        if (model.hasOwnProperty(this._dataIsGroupField)) {
            if (model[this._dataIsGroupField]) {
                listItem.classList.add("dp-accordion-list-item-main");
            }
        } else if (
            !model[this._dataParentIdField] ||
            model[this._dataParentIdField] === this._nullGuid
        ) {
            listItem.classList.add("dp-accordion-list-item-main");
        }

        listItem.classList.add("dp-group-list-item");
        listItem.append(newButton);

        let isSelectedButtonGroupButton;

        if (!this._selectedButton) {
            isSelectedButtonGroupButton = false;
        } else {
            isSelectedButtonGroupButton =
                this._groupButtons.indexOf(this._selectedButton! as HTMLButtonElement) !== -1;
        }

        if (!isSelectedButtonGroupButton) {
            this._mainList!.append(listItem);
        } else {
            this._selectedButton!.classList.add("dp-is-group");
            const subList =
                this._selectedButton!.nextElementSibling?.nodeName === "UL"
                    ? this._selectedButton!.nextElementSibling
                    : null;
            if (subList) {
                subList.append(listItem);
            } else {
                const subList = document.createElement("ul");
                this._lists.push(subList);
                this._subLists.push(subList);

                subList.classList.add("dp-group-items");
                subList.append(listItem);
                this._selectedButton!.parentElement!.append(subList);
            }
        }

        this._setMode(this._mode);
    }

    /**
     * @param model - данные для кнопки
     * @private создание новой кнопки
     * @returns - возвращает новую кнопку
     */
    private _createButton(model: any) {
        const list = this.dataSource!.data.list;
        const button = document.createElement("button");
        button.dataset.value = model[this._dataValueField];
        button.classList.add("dp-item-blue");
        button.dataset.uid = model.uid;
        if (model[this._dataParentIdField]) {
            button.dataset[this._dataParentIdField] = model[this._dataParentIdField];
        }

        if (model[this._dataIconField]) {
            const isSpriteIcon = !model[this._dataIconField].includes("base64");
            if (isSpriteIcon) {
                const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

                this._icons.push(icon);
                use.setAttributeNS(
                    "http://www.w3.org/1999/xlink",
                    "href",
                    `/images/svg/dpicons.svg#${model[this._dataIconField]}`
                );

                icon.classList.add("dp-icon-button-svg");
                icon.append(use);

                button.classList.add("dp-accordion-btn");
                button.prepend(icon);
            } else {
                const icon = document.createElement("img");
                icon.classList.add("dp-icon-button-svg");
                icon.src = model[this._dataIconField];

                button.classList.add("dp-accordion-btn");
                button.prepend(icon);
            }
        }

        if (model[this._dataTextField]) {
            const text = document.createElement("p");
            this._textParagraphs.push(text);

            text.classList.add("dp-accordion-text");
            text.textContent = model[this._dataTextField];

            button.append(text);
        }

        this._buttons.push(button);

        let isGroup = false;

        if (model.hasOwnProperty(this._dataIsGroupField)) {
            isGroup = model[this._dataIsGroupField];
        } else if (
            !model[this._dataParentIdField] ||
            model[this._dataParentIdField] === this._nullGuid
        ) {
            isGroup = true;
        }

        if (isGroup) {
            this._groupButtons.push(button);
            button.classList.add("dp-item-main");

            const hasChildrenButtons = list.some(
                (item: any) => item[this._dataParentIdField] === model.uid
            );
            if (hasChildrenButtons) {
                button.classList.add("dp-is-group");
            }
        }

        return button;
    }

    /**
     * @param model - данные удаляемой кнопки
     * @private удаление кнопки
     */
    private _removeItem(model: any) {
        if (this._selectedButton?.dataset.uid !== model.uid) {
            this._selectedButton = this._buttons.find((button) => {
                return button.dataset.uid === model.uid;
            });
        }
        this._selectedButton!.parentElement!.remove();
        this._buttons = this._buttons.filter((button) => button.dataset.uid !== model.uid);
        if (model[this._dataIsGroupField]) {
            this._buttons = this._buttons.filter(
                (button) => button.dataset[this._dataParentIdField] !== model[this._dataValueField]
            );
        }

        if (model[this._dataParentIdField]) {
            const list = this.dataSource!.data.list;

            const parentButtonHasChildren = list.some(
                (item: any) => item[this._dataParentIdField] === model[this._dataParentIdField]
            );

            if (!parentButtonHasChildren) {
                const parentButton = this._buttons.find(
                    (button) => button.dataset.value === model[this._dataParentIdField]
                );

                parentButton!.classList.remove("dp-is-group");
            }
        }

        this.ClearSelect();
    }

    /**
     * @private установка классов и создание события из кнопки, если в компонент передан ее id
     */
    private _setSelectedButton() {
        if (!this._selectedId || this._buttons.length < 1) {
            return;
        }

        const button = this._buttons.find((button) => button.dataset.value === this._selectedId);

        if (!button) {
            return;
        }

        const uid = button.dataset.uid as string;
        this._selected = this.dataSource!.GetByUid(uid);

        this._selectedButton = button;

        this._dispatchChangedEvent();
        this._addSelectedButtonClasses();
    }

    /**
     * @public изменение родителя элемента
     * @param id - id кнопки
     * @param parentId - parentId кнопки
     */
    public SetNewParent(id: string, parentId: string) {
        const model = this.dataSource!.GetById(id);
        const button = this._buttons.find((button) => button.dataset.uid === model.uid);
        const parentModel = this.dataSource!.GetById(parentId);
        const parentButton = this._buttons.find((button) => button.dataset.uid === parentModel.uid);
        const subList =
            parentButton!.nextElementSibling?.nodeName === "UL"
                ? parentButton!.nextElementSibling
                : null;
        const oldParentButton = this._buttons.find(
            (button) => button.dataset.value === model[this._dataParentIdField]
        );

        if (!model || !parentModel) {
            return;
        }

        if (!parentModel[this._dataIsGroupField]) {
            return;
        }

        if (!subList) {
            parentButton!.classList.add("dp-is-group");
            const subList = document.createElement("ul");
            const parentListItem = parentButton!.parentElement as HTMLLIElement;
            const listItem = button!.parentElement as HTMLLIElement;

            subList.classList.add("dp-group-items");
            this._lists.push(subList);
            this._subLists.push(subList);
            subList.append(listItem);
            parentListItem.append(subList);
        } else {
            const listItem = button!.parentElement as HTMLLIElement;
            subList.append(listItem);
            parentButton!.classList.add("dp-is-group");
        }

        button!.dataset.parentId = parentId;
        model[this._dataParentIdField] = parentId;

        const oldParentButtonHasChildren = this.dataSource!.data.list.some(
            (item: any) => item[this._dataParentIdField] === oldParentButton!.dataset.value
        );

        if (!oldParentButtonHasChildren) {
            oldParentButton!.classList.remove("dp-is-group");
        }

        this._addSelectedButtonClasses();
    }

    /**
     * @param list - массив моделей кнопок
     * @public сортировка кнопок
     */
    public SortItems(list: Array<any>) {
        this._getList(list);
    }

    /**
     * @public поиск кнопок по переданному полю(по умолчанию - текст кнопки)
     * @param query - поисковой запрос, которому должна соответствовать кнопка
     * @param field - поле, по которому происходит поиск
     */
    public FindItems(query: string, field: string = this._dataTextField) {
        if (field === this._dataTextField) {
            this._findItemsByName(query);
        } else {
            this._findItemsByField(query, field);
        }
    }

    /**
     * @param name - текст кнопки
     * @private фильтр кнопок по их тексту
     */
    private _findItemsByName(name: string) {
        const result = this.dataSource!.data.list.filter((model: any) =>
            model[this._dataTextField].toLowerCase().includes(name.toLowerCase())
        );

        if (result.length === 0) {
            this._hideAllButtons();

            return;
        }

        const parentsList = this._getFoundModelsParents(result);
        const filteredList = [...result, ...parentsList];

        this._setButtonsVisibility(filteredList);
        this._setGroupButtons();

        if (name === "") {
            this.CollapseAll();

            if (!this._selected) {
                return;
            }

            const hasParent =
                this._selected[this._dataParentIdField] &&
                this._selected[this._dataParentIdField] !== this._nullGuid;

            if (hasParent) {
                const parentButton = this._buttons.find(
                    (button) => button.dataset.value === this._selected[this._dataParentIdField]
                ) as HTMLButtonElement;

                const subList = parentButton!.nextElementSibling as HTMLUListElement;

                parentButton!.classList.add("inner");

                this._addGroupButtonClasses(parentButton, subList);
            }

            return;
        }

        this.ExpandAll();
    }

    /**
     * @private поиск кнопок по переданному полю(по умолчанию - текст кнопки)
     * @param query - поисковой запрос, которому должна соответствовать кнопка
     * @param field - поле, по которому происходит поиск
     */
    private _findItemsByField(query: string, field: string) {
        const result = this.dataSource!.data.list.filter((model: any) => model[field] === query);

        if (result.length === 0) {
            this._hideAllButtons();

            return;
        }

        const parentsList = this._getFoundModelsParents(result);
        const filteredList = [...result, ...parentsList];

        this._setButtonsVisibility(filteredList);
        this._setGroupButtons();
        this.ExpandAll();
    }

    /**
     * @private получаем список моделей родителей кнопок, удовлетворяющих поисковому запросу
     * @param models - список кнопок, удовлетворяющих поисковому запросу
     * @returns
     */
    private _getFoundModelsParents(models: Array<any>) {
        const list = this.dataSource!.data.list;
        const parentIdArray = models.map((model) => model[this._dataParentIdField]);

        const parentsList = list.filter((model: any) => {
            if (parentIdArray.indexOf(model[this._dataValueField]) !== -1) {
                return model;
            }
        });

        return parentsList;
    }

    /**
     * @private задаем видимость кнопок
     * @param list - массив моделей кнопок
     */
    private _setButtonsVisibility(list: Array<any>) {
        for (let button of this._buttons) {
            const uid = button.dataset.uid;
            const isInList = list.find((model) => model.uid === uid);

            if (isInList) {
                button.parentElement!.dataset.visible = "true";
            } else {
                button.parentElement!.dataset.visible = "false";
            }
        }
    }

    /**
     * @private скрываем все кнопки
     */
    private _hideAllButtons() {
        for (let button of this._buttons) {
            button.parentElement!.dataset.visible = "false";
        }
    }

    /**
     * @private добавляем/удаляем класс для стрелочки справа для групповых кнопок
     */
    private _setGroupButtons() {
        for (let groupButton of this._groupButtons) {
            const subList =
                groupButton.nextElementSibling?.nodeName === "UL" ? groupButton.nextElementSibling : null;

            if (!subList) {
                groupButton.classList.remove("dp-is-group");

                continue;
            }

            const childListItems = [...subList.children] as Array<HTMLButtonElement>;

            if (childListItems.length === 0) {
                groupButton.classList.remove("dp-is-group");

                continue;
            }

            const hiddenChildListItems = childListItems.filter(
                (child) => child.dataset.visible === "false"
            );

            if (childListItems.length === hiddenChildListItems.length) {
                groupButton.classList.remove("dp-is-group");

                continue;
            }

            groupButton.classList.add("dp-is-group");
        }
    }

    /**
     * @param id - id модели дочерней кнопки компонента
     * @param status - true - для блокировки, false для включения
     * @public блокировка/включение дочерней кнопки аккордеона
     */
    public Disable(id: string, status: boolean) {
        const list = this.dataSource!.data.list;
        const model = list.find((model: any) => model[this._dataValueField] === id);
        const button = this._buttons.find((button) => button.dataset.uid === model.uid);

        button!.disabled = status;
    }

    /**
     * @public закрытие всех вложенных списков
     */
    public CollapseAll() {
        for (let button of this._groupButtons) {
            button.classList.remove("is-open");
        }
        for (let subList of this._subLists) {
            subList.classList.remove("active");
        }
    }

    /**
     * @public открытие всех вложенных списков
     */
    public ExpandAll() {
        for (let button of this._groupButtons) {
            button.classList.add("is-open");
        }
        for (let subList of this._subLists) {
            subList.classList.add("active");
        }
    }

    /**
     * @public очистка выделения кнопок
     */
    public ClearSelect() {
        this._selectedButton = undefined;
        this._selected = undefined;

        if (this._buttons.length < 1) {
            return;
        }

        for (let button of this._buttons) {
            button.classList.remove("inner");
            button.classList.remove("active");
        }
    }

    /**
     * @public сдвинуть элемент выше
     */
    public MoveUp(id: string) {
        const model = this.dataSource!.GetById(id);
        const button = this._buttons.find((button) => button.dataset.uid === model.uid);
        const parentListItem = button!.parentElement;
        const previousListItem = parentListItem?.previousElementSibling;

        if (previousListItem) {
            previousListItem.before(parentListItem);
        }

        this._checkUpAndDown(id);
        this._dispatchPositionEvent();
    }

    /**
     * @public сдвинуть элемент ниже
     */
    public MoveDown(id: string) {
        const model = this.dataSource!.GetById(id);
        const button = this._buttons.find((button) => button.dataset.uid === model.uid);
        const parentListItem = button!.parentElement;
        const nextListItem = parentListItem?.nextElementSibling;

        if (nextListItem) {
            nextListItem.after(parentListItem);
        }

        this._checkUpAndDown(id);
        this._dispatchPositionEvent();
    }

    /**
     * @private проверка элемента на возможность сдвинуть его вверх/вниз в списке
     * @param id - id модели элемента
     */
    private _checkUpAndDown(id: string) {
        const result = { up: undefined, down: undefined } as any;

        if (!id) {
            result.up = false;
            result.down = false;

            return;
        }
        const model = this.dataSource!.GetById(id);
        const button = this._buttons.find((button) => button.dataset.uid === model.uid);
        this._hasPrevSibling = Boolean(button!.parentElement!.previousElementSibling);
        this._hasNextSibling = Boolean(button!.parentElement!.nextElementSibling);

        result.up = this._hasPrevSibling;
        result.down = this._hasNextSibling;

        this._position = result;
    }

    //#region сеттеры и геттеры
    get dataSource(): DPDataSource | null {
        return this._dataSource ? this._dataSource : null;
    }

    set dataSource(value: DPDataSource | null) {
        this._setProperty("dataSource", value);
    }

    set mode(value: string) {
        this._setProperty("mode", value);
    }

    get mode(): string {
        return this._mode;
    }

    set selected(value: object | string) {
        this._setProperty("selected", value);
    }

    get selected(): object {
        return this._selected;
    }

    set selectedId(id: string) {
        this._setProperty("selectedId", id);
    }

    get selectedId(): string {
        return this._selectedId;
    }

    set dataValueField(dataValueField: string) {
        if (!this.isRender) {
            this._dataValueField = dataValueField;
        } else {
            throw new Error(`Свойство dataValueField доступно только для чтения`);
        }
    }

    get dataValueField(): string {
        return this._dataValueField;
    }

    set dataTextField(dataTextField: string) {
        if (!this.isRender) {
            this._dataTextField = dataTextField;
        } else {
            throw new Error(`Свойство dataTextField доступно только для чтения`);
        }
    }

    get dataTextField(): string {
        return this._dataTextField;
    }

    set dataIconField(dataIconField: string) {
        if (!this.isRender) {
            this._dataIconField = dataIconField;
        } else {
            throw new Error(`Свойство dataIconField доступно только для чтения`);
        }
    }

    get dataIconField(): string {
        return this._dataIconField;
    }

    set dataParentIdField(dataParentIdField: string) {
        if (!this.isRender) {
            this._dataParentIdField = dataParentIdField;
        } else {
            throw new Error(`Свойство dataParentIdField доступно только для чтения`);
        }
    }

    get dataParentIdField(): string {
        return this._dataParentIdField;
    }

    set dataIsGroupField(dataIsGroupField: string) {
        if (!this.isRender) {
            this._dataIsGroupField = dataIsGroupField;
        } else {
            throw new Error(`Свойство dataIsGroupField доступно только для чтения`);
        }
    }

    get dataIsGroupField(): string {
        return this._dataIsGroupField;
    }

    get position(): string {
        return this._position;
    }
    //#endregion
}
);

customElements.define('dataplat-menu', class DPTab extends HTMLElement {
    public isRender: boolean;
    DeltaX: number;

    private _state: boolean;
    private _firstName: string;
    private _secondName: string;
    private _contentSize: number;
    private _twoNames: boolean;

    private Menu: HTMLElement | undefined;
    private TabBar: HTMLElement | null;
    private Resizer: HTMLElement | undefined;
    private ResizeBlock: HTMLElement | undefined;
    private Resize: Function | undefined;

    constructor() {
        super();
        this.isRender = false;
        this.DeltaX = 0;

        this._state = true;
        this._firstName = 'Не выбран';
        this._secondName = 'Не выбран';
        this._twoNames = false;
        this._contentSize = window.innerWidth;

        this.TabBar = null;
    }

    connectedCallback() {
        if (!this.isRender) {
            this.Menu = this as HTMLElement;
            this.Menu.classList.add('dp-main__menu');
            document.addEventListener('DOMContentLoaded', (e) => this.OnLoad());
            this.isRender = true;
        }
    }

    private OnLoad() {
        window.addEventListener('resize', (e) => this.ResizeChanged(e));
        if (this.Menu) {
            this.Resizer = this.GetRisezerBlock();
            this.Menu.after(this.Resizer);
            this.Menu.append(this.CreateScreenResize());

            this.TabBar = this.Menu.querySelector('.dp-main__menu-tabs');
            this.TabBar?.append(this.GetTabButton());
        }
        this.HandlerParams();
    }

    static get observedAttributes() {
        return ['firstname', 'secondname', 'state', 'twonames'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        if (name) {
            switch (name) {
                case 'firstName':
                case 'firstname':
                    if (typeof newValue === 'string') {
                        this.SetName('first', newValue);
                    } else {
                        throw new Error('Переданное значение для firstName не является типом string');
                    }
                    break;
                case 'secondName':
                case 'secondname':
                    if (typeof newValue === 'string') {
                        this.SetName('second', newValue);
                    } else {
                        throw new Error('Переданное значение для secondName не является типом string');
                    }
                    break;
                case 'state':
                    if (typeof newValue === 'boolean') {
                        this.MenuVisibleChange(newValue);
                    } else {
                        if (newValue === 'true') {
                            this.MenuVisibleChange(true);
                        } else if (newValue === 'false') {
                            this.MenuVisibleChange(false);
                        } else {
                            throw new Error('Переданное значение для state не является true | false');
                        }
                    }
                    break;
                case 'twoNames':
                case 'twonames':
                    if (typeof newValue === 'boolean') {
                        this.GetSecondButton(newValue);
                    } else {
                        if (newValue === 'true') {
                            this.GetSecondButton(true);
                        } else if (newValue === 'false') {
                            this.GetSecondButton(false);
                        } else {
                            throw new Error('Переданное значение для twoNames не является true | false');
                        }
                    }
                    break;
            }
        }
    }

    /** Обработка параметров */
    private HandlerParams() {
        DPElements.Global.CheckProperty(this, 'firstName');
        DPElements.Global.CheckProperty(this, 'secondName');
        DPElements.Global.CheckProperty(this, 'state');
        DPElements.Global.CheckProperty(this, 'twoNames');
    }

    /** Создаем фон для бесперебойной работы сплиттера */
    private CreateScreenResize() {
        this.ResizeBlock = document.createElement('div');
        this.ResizeBlock.classList.add('dp-modal-resize-transparent');
        this.ResizeBlock.dataset.visible = 'false';
        this.ResizeBlock.addEventListener('click', () => {
            this.ToggleVisibleResizeBlock(false);
        });

        return this.ResizeBlock;
    }

    /** Показываем или скрываем фоновой блок */
    private ToggleVisibleResizeBlock(value: boolean) {
        if (typeof value === 'boolean') {
            if (this.ResizeBlock) {
                let visible = this.ResizeBlock.dataset.visible;
                if (visible) {
                    this.ResizeBlock.dataset.visible = `${value}`;
                }
            }
        }
    }

    /**Получаем эелемент  */
    private GetRisezerBlock() {
        let block = document.createElement('div');
        let resize = document.createElement('div');
        let span = document.createElement('span');
        block.classList.add('dp-spliter');
        block.tabIndex = 15;
        resize.classList.add('dp-resize');
        span.classList.add('dp-resize-in');
        resize.addEventListener('pointerdown', (e) => this.BeginMenuResize(e));
        resize.addEventListener('dblclick', (e) => this.ChangeMenuState());
        resize.append(span);
        block.append(resize);
        return block;
    }

    /** Добавление кнопки */
    private GetTabButton() {
        const button = document.createElement('button');
        const TabName = document.createElement('span');
        button.classList.add('dp-tab-list-button');
        TabName.classList.add('dp-tab-button-text-left');
        TabName.innerText = 'Не выбран';
        button.addEventListener('click', (e) => this.TabClicked(e));

        button.append(TabName);
        return button;
    }

    /**
     *  Нажатие кнопки на левой вкладке
     * @param {Event} event - событие кнопки
     */
    private TabClicked(event: MouseEvent | PointerEvent) {
        if (event.button === 0) {
            this.ChangeMenuState();
        }
    }

    /**
     * Событие изменение размера
     * @param {Event} event - текущий размер окна
     */
    private ResizeChanged(event: Event) {
        let target = event.target as unknown as Window;
        if (target.innerWidth <= 1024) {
            if (this.state) {
                this.state = false;
            }
        }
        this._contentSize = target.innerWidth;

        if (typeof this.Resize === 'function') {
            this.Resize();
        }
    }

    /**
     *
     * @param {any} event
     */
    private BeginMenuResize(event: MouseEvent | PointerEvent) {
        if (event.button === 0) {
            if (this.state) {
                this.ToggleVisibleResizeBlock(true);
                if (this.Resizer) {
                    this.DeltaX = event.pageX - this.Resizer.clientWidth;
                }
                document.onpointermove = (e) => this.MoveMenu(e);
                document.addEventListener('pointerup', () => this.StopMenuResize());
            }
        }
    }

    /** Останавливаем подписку на перемещение мышы */
    private StopMenuResize() {
        this.ToggleVisibleResizeBlock(false);
        document.onpointermove = null;
    }

    /** Изменяем состояние меню */
    private ChangeMenuState() {
        this.state = !this.state;
    }

    /** Отправляем кастомное событие */
    DispatchStateEvent() {
        let ChangedEvent = new CustomEvent('state', {
            detail: {
                element: this
            }
        });
        this.dispatchEvent(ChangedEvent);
    }

    /**
     * Меняем ширину меню
     * @param {PointerEvent} event - событие мыши
     */
    private MoveMenu(event: MouseEvent | PointerEvent) {
        if (event.pageX <= 220) {
            if (this.Menu) this.Menu.style.width = `${40}px`;
            if (this.state) {
                this.state = false;
                this.ToggleVisibleResizeBlock(false);
            }
        } else {
            if (this.Menu) this.Menu.style.width = `${event.pageX}px`;
        }
    }

    /**
     * Меняем видимость меню
     * @param value - true - Открыть меню
     */
    private MenuVisibleChange(value: boolean) {
        this._state = value;
        let tabs = this.Menu?.querySelector('.dp-main__menu-tabs') as HTMLElement | null;
        let menu = this.Menu?.querySelector(
            '.dp-main__menu-tab-content'
        ) as HTMLElement | null;
        if (tabs && menu && this.Menu) {
            this.Menu.style.width = '';
            if (value) {
                tabs.dataset.open = 'false';
                menu.dataset.open = 'true';
                this.Menu.dataset.open = 'true';
            } else {
                document.onpointermove = null;
                tabs.dataset.open = 'true';
                menu.dataset.open = 'false';
                this.Menu.dataset.open = 'false';
            }
            this.DispatchStateEvent();
        }
    }

    private SetName(type: string, value: string) {
        const buttonText = this.Menu?.querySelectorAll('.dp-tab-button-text-left');
        let button: HTMLElement | undefined;
        if (buttonText) {
            if (type === 'second' && this._twoNames) {
                if (buttonText[1]) {
                    button = buttonText[1] as HTMLElement;
                }
            } else if (type === 'first') {
                if (buttonText[0]) {
                    button = buttonText[0] as HTMLElement;
                }
            }

            if (button) {
                if (value === null || value === '') {
                    button.innerText = 'Не выбран';
                    if (this._twoNames && type === 'second') {
                        this._secondName = 'Не выбран';
                    } else {
                        this._firstName = 'Не выбран';
                    }
                } else {
                    button.innerText = value;
                    if (this._twoNames && type === 'second') {
                        this._secondName = value;
                    } else {
                        this._firstName = value;
                    }
                }
            }
        }

    }

    private GetSecondButton(value: boolean) {
        const buttons = this.Menu?.querySelectorAll('.dp-tab-list-button');
        if (buttons) {
            if (value && buttons?.length === 1) {
                this.TabBar?.append(this.GetTabButton());
            } else if (!value) {
                if (buttons) {
                    if (buttons?.length > 1) {
                        buttons[1].remove();
                    }
                }
            }
        }

        this._twoNames = value;
    }

    // #region set and get

    set state(value) {
        this._setProperty('state', value);
    }

    set firstName(value: string) {
        this._setProperty('firstName', value);
    }

    set secondName(value: string) {
        this._setProperty('secondName', value);
    }

    set twoNames(value: boolean) {
        this._setProperty('twoNames', value);
    }

    get state(): boolean {
        return this._state;
    }

    get firstName(): string {
        return this._firstName;
    }

    get secondName(): string {
        return this._secondName;
    }

    get twoNames(): boolean {
        return this._twoNames;
    }

    // #endregion
});

customElements.define("dataplat-progress", class DataPlatProgress extends HTMLElement {
    private _value: number;
    private _min: number;
    private _max: number;
    private _animation: boolean;
    private _disabled: boolean;

    public isRender: boolean;

    private _ProgressBar: HTMLDivElement;
    private _ProgressValue: HTMLSpanElement;

    constructor() {
        super();

        this._value = 0;
        this._min = 0;
        this._max = 100;
        this._animation = true;
        this._disabled = false;

        this.isRender = false;

        this._ProgressBar = document.createElement("div");
        this._ProgressValue = document.createElement("span");
    }

    connectedCallback() {
        this._checkIsRendered();
    }

    static get observedAttributes() {
        return ["value", "min", "max", "animation", "disabled"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "value":
                this._setValue(Number(newValue));
                break;
            case "min":
                this._setMin(Number(newValue));
                break;
            case "max":
                this._setMax(Number(newValue));
                break;
            case "animation":
                this._setAnimation(newValue);
                break;
            case "disabled":
                this._setDisabled(newValue);
                break;
            default:
                return;
        }
    }

    /**
     * @private проверка перед рендером, для предотвращения повторного рендера
     */
    private _checkIsRendered() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private рендер компонента
     */
    private _render() {
        this._checkProperties();
        this.classList.add("dp-progress");
        this._setAnimationStatus();
        this._setProgressValue();
        this._setProgressBar();
        this._setProgress();

        this.append(this._ProgressBar);
    }

    /**
     * @private получаем значения атрибутов
     */
    private _checkProperties() {
        DPElements.Global.CheckProperty(this, "value");
        DPElements.Global.CheckProperty(this, "min");
        DPElements.Global.CheckProperty(this, "max");
        DPElements.Global.CheckProperty(this, "animation");
        DPElements.Global.CheckProperty(this, "disabled");
    }

    /**
     * @private настраиваем прогресс бар
     */
    private _setProgressBar() {
        this._ProgressBar.classList.add("dp-progress-bar");

        this._ProgressBar.append(this._ProgressValue);
        this._setProgress();
    }

    /**
     * @private настраиваем текстовое отображение значения прогресса
     */
    private _setProgressValue() {
        this._ProgressValue.classList.add("dp-progress-value");
    }

    /**
     * @private задаем ширину прогресс бара и текстовое отображение значения прогресса
     */
    private _setProgress() {
        const progress = Math.round((this._value / this._max) * 100);

        if (progress > 10) {
            this.dataset.progressLow = "false";
        } else {
            this.dataset.progressLow = "true";
        }

        this._ProgressBar.style.width = `${progress}%`;
        this._ProgressValue.textContent = `${progress}%`;
    }

    /**
     * @private задаем статус наличия анимации
     */
    private _setAnimationStatus() {
        this.dataset.animation = `${this._animation}`;
    }

    /**
     * @private устанавливаем новое значение value
     * @param value - новое значение value
     */
    private _setValue(value: number) {
        const oldValue = this._value;

        if (value === oldValue) {
            return;
        }

        if (value > this._max) {
            this.value = this._max;
        } else if (value < this._min) {
            this.value = this._min;
        } else {
            if (this._value > value) {
                this._value = value;
            } else {
                this._setValueLoopWithDelay(value);
            }
        }

        this._setProgress();
    }

    /**
     * @private задержка при присвоении значения для лучшего визуального эффекта
     * @param newValue новое значение прогресс бара
     */
    private _setValueLoopWithDelay(newValue: number) {
        setTimeout(() => {
            this._setProgress();
            if (this._value < newValue) {
                this._value += 1;
                this._setValueLoopWithDelay(newValue);
            }
        }, 150);
    }

    /**
     * @private устанавливаем новое значение min
     * @param value - новое значение min
     */
    private _setMin(value: number) {
        const oldValue = this._min;

        if (value === oldValue) {
            return;
        }

        this._min = value;

        if (this._value < this._min) {
            this.value = this._min;
        }
        this._setProgress();
    }

    /**
     * @private устанавливаем новое значение max
     * @param value - новое значение max
     */
    private _setMax(value: number) {
        const oldValue = this._max;

        if (value === oldValue) {
            return;
        }

        this._max = value;

        if (this._value > this._max) {
            this.value = this._max;
        }

        this._setProgress();
    }

    /**
     * @private устанавливаем новое значение наличия анимации
     * @param value - новое значение animation
     */
    private _setAnimation(value: boolean) {
        if (typeof value === "boolean") {
            const oldValue = this._animation;

            if (value === oldValue) {
                return;
            }

            this._animation = value;
            this._setAnimationStatus();
        } else {
            this._setAnimation(value === "true" ? true : false);
        }
    }

    /**
     * @private устанавливаем новое значение disabled
     * @param value - новое значение disabled
     */
    private _setDisabled(value: boolean) {
        if (typeof value === "boolean") {
            const oldValue = this._disabled;

            if (value === oldValue) {
                return;
            }

            this._disabled = value;
            this.dataset.disabled = `${this._disabled}`;
        } else {
            this._setDisabled(value === "true" ? true : false);
        }
    }

    //#region геттеры и сеттеры
    get value(): number {
        return this._value;
    }

    set value(value: number) {
        this._setProperty("value", value);
    }

    get min(): number {
        return this._min;
    }

    set min(min: number) {
        this._setProperty("min", min);
    }

    get max(): number {
        return this._max;
    }

    set max(max: number) {
        this._setProperty("max", max);
    }

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(disabled: boolean) {
        this._setProperty("disabled", disabled);
    }

    get animation(): boolean {
        return this._animation;
    }

    set animation(animation: boolean) {
        this._setProperty("animation", animation);
    }
    //#endregion геттеры и сеттеры
}
);

customElements.define("dataplat-range", class DataPlatRange extends HTMLElement {
    private _valueFirst: number;
    private _valueSecond: number;
    private _min: number;
    private _max: number;
    private _disabled: boolean;
    private _double: boolean;
    private _intervals: number;
    private _stepMode: string;
    private _vertical: boolean;
    private _marks: boolean;
    private _numbers: boolean;

    public isRender: boolean;

    private _numbersArray: Array<HTMLSpanElement>;
    private _leftFirst: number;
    private _leftSecond: number;
    private _topFirst: number;
    private _topSecond: number;
    private _sliderFirstIsClicked: boolean;
    private _sliderSecondIsClicked: boolean;
    private _shiftX: number;
    private _shiftY: number;
    private _trackLength: number;

    private _SliderFirst: HTMLSpanElement;
    private _SliderSecond: HTMLSpanElement;
    private _Marks: HTMLDivElement;

    constructor() {
        super();

        this._valueFirst = 0;
        this._valueSecond = this._valueFirst + 1;
        this._min = 0;
        this._max = 100;
        this._disabled = false;
        this._double = false;
        this._intervals = 4;
        this._stepMode = "arrow";
        this._vertical = false;
        this._marks = true;
        this._numbers = true;

        this.isRender = false;

        this._numbersArray = [];
        this._leftFirst = 0;
        this._leftSecond = 0;
        this._topFirst = 0;
        this._topSecond = 0;
        this._sliderFirstIsClicked = false;
        this._sliderSecondIsClicked = false;
        this._shiftX = 0;
        this._shiftY = 0;
        this._trackLength = 88;

        this._SliderFirst = document.createElement("span");
        this._SliderSecond = document.createElement("span");
        this._Marks = document.createElement("div");
    }

    connectedCallback() {
        this._checkIsRendered();
    }

    static get observedAttributes() {
        return [
            "valueFirst",
            "valueSecond",
            "min",
            "max",
            "disabled",
            "intervals",
            "stepMode",
            "vertical",
            "marks",
            "numbers",
        ];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "value":
                this._setValue(newValue);
                break;
            case "valueFirst":
                this._setValueFirst(Number(newValue));
                break;
            case "valueSecond":
                this._setValueSecond(Number(newValue));
                break;
            case "min":
                this._setMin(Number(newValue));
                break;
            case "max":
                this._setMax(Number(newValue));
                break;
            case "disabled":
                this._setDisabled(newValue);
                break;
            case "double":
                this._setDouble(newValue);
                break;
            case "intervals":
                this._setIntervals(Number(newValue));
                break;
            case "stepMode":
                this._setStepMode(newValue);
                break;
            case "vertical":
                this._setVertical(newValue);
                break;
            case "marks":
                this._setMarks(newValue);
                break;
            case "numbers":
                this._setNumbers(newValue);
                break;
            default:
                return;
        }
    }

    /**
     * @private проверка перед рендером, для предотвращения повторного рендера
     */
    private _checkIsRendered() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private рендер компонента
     */
    private _render() {
        this._checkProperties();
        this._setSliders();
        this._setIntervalsElement();
        this._setRange();

        this._addEventListeners();
    }

    /**
     * @private получаем значения атрибутов
     */
    private _checkProperties() {
        DPElements.Global.CheckProperty(this, "valueFirst", false, false);
        DPElements.Global.CheckProperty(this, "valueSecond", false, false);
        DPElements.Global.CheckProperty(this, "min");
        DPElements.Global.CheckProperty(this, "max");
        DPElements.Global.CheckProperty(this, "disabled");
        DPElements.Global.CheckProperty(this, "double");
        DPElements.Global.CheckProperty(this, "intervals");
        DPElements.Global.CheckProperty(this, "stepMode");
        DPElements.Global.CheckProperty(this, "vertical");
        DPElements.Global.CheckProperty(this, "marks");
        DPElements.Global.CheckProperty(this, "numbers");
    }

    /**
     * @private настраиваем родительский компонент DataPlatRange
     */
    private _setRange() {
        const sliderTrack = this._createTrack();

        this._setRangeMode();
        this._setRangeOrientation();
        this.SetMarksVisibility();
        this._setNumbersVisibility();

        this.classList.add("dp-range");
        this.append(sliderTrack, this._Marks);
    }

    /**
     * @private создаем трек, по которому бегают ползунки
     * @returns div SliderTrack
     */
    private _createTrack() {
        const sliderTrack = document.createElement("div");
        sliderTrack.classList.add("dp-range-track");
        sliderTrack.append(this._SliderFirst, this._SliderSecond);

        return sliderTrack;
    }

    /**
     * @private настраиваем слайдеры
     */
    private _setSliders() {
        this._SliderFirst.classList.add("dp-range-slider");
        this._SliderSecond.classList.add("dp-range-slider");

        this._setSlidersTitle();
        this._setSlidersDisabled();
        this._setSlidersPosition();
    }

    /**
     * @private задаем title слайдеров
     */
    private _setSlidersTitle() {
        this._SliderFirst.setAttribute("title", `${this._valueFirst}`);
        this._SliderSecond.setAttribute("title", `${this._valueSecond}`);
    }

    /**
     * @private задаем позиции слайдеров
     */
    private _setSlidersPosition() {
        this._setSliderFirstPosition();
        this._setSliderSecondPosition();
    }

    /**
     * @private задаем позицию  1-го слайдера
     */
    private _setSliderFirstPosition() {
        if (!this._vertical) {
            this._setSliderFirstPositionHorizontal();
        } else {
            this._setSliderFirstPositionVertical();
        }
    }

    /**
     * @private задаем позицию  2-го слайдера
     */
    private _setSliderSecondPosition() {
        if (!this._vertical) {
            this._setSliderSecondPositionHorizontal();
        } else {
            this._setSliderSecondPositionVertical();
        }
    }

    /**
     * @private задаем позицию первого слайдера в горизонтальной ориентации компонента
     */
    private _setSliderFirstPositionHorizontal() {
        if (this._min === 0) {
            const leftFirst = (this._valueFirst / this._max) * this._trackLength;

            if (this._leftFirst === leftFirst) {
                return;
            }

            this._leftFirst = leftFirst;
        } else {
            const leftFirst =
                ((this._valueFirst - this._min) / (this._max - this._min)) * this._trackLength;

            if (this._leftFirst === leftFirst) {
                return;
            }

            this._leftFirst = leftFirst;
        }

        this._SliderFirst.style.left = this._leftFirst + "px";
    }

    /**
     * @private задаем позицию первого слайдера в вертикальной ориентации компонента
     */
    private _setSliderFirstPositionVertical() {
        if (this._min === 0) {
            const topFirst = this._trackLength - (this._valueFirst / this._max) * this._trackLength;
            if (topFirst === this._topFirst) {
                return;
            }
            this._topFirst = topFirst;
        } else {
            const topFirst =
                this._trackLength -
                ((this._valueFirst - this._min) / (this._max - this._min)) * this._trackLength;

            if (topFirst === this._topFirst) {
                return;
            }

            this._topFirst = topFirst;
        }

        this._SliderFirst.style.top = this._topFirst + "px";
    }

    /**
     * @private задаем позицию второго слайдера в горизонтальной ориентации компонента
     */
    private _setSliderSecondPositionHorizontal() {
        if (this._min === 0) {
            const leftSecond = (this._valueSecond / this._max) * this._trackLength;

            if (this._leftSecond === leftSecond) {
                return;
            }

            this._leftSecond = leftSecond;
        } else {
            const leftSecond =
                ((this._valueSecond - this._min) / (this._max - this._min)) * this._trackLength;

            if (this._leftSecond === leftSecond) {
                return;
            }

            this._leftSecond = leftSecond;
        }

        this._SliderSecond.style.left = this._leftSecond + "px";
    }

    /**
     * @private задаем позицию второго слайдера в вертикальной ориентации компонента
     */
    private _setSliderSecondPositionVertical() {
        if (this._min === 0) {
            const topSecond = this._trackLength - (this._valueSecond / this._max) * this._trackLength;
            if (topSecond === this._topSecond) {
                return;
            }
            this._topSecond = topSecond;
        } else {
            const topSecond =
                this._trackLength -
                ((this._valueSecond - this._min) / (this._max - this._min)) * this._trackLength;

            if (topSecond === this._topSecond) {
                return;
            }

            this._topSecond = topSecond;
        }

        this._SliderSecond.style.top = this._topSecond + "px";
    }

    /**
     * @private задаем disabled слайдеров
     */
    private _setSlidersDisabled() {
        this._SliderFirst.dataset.disabled = `${this._disabled}`;
        this._SliderSecond.dataset.disabled = `${this._disabled}`;
    }

    /**
     * @private настраиваем контейнер с интервалами
     */
    private _setIntervalsElement() {
        this._Marks.innerHTML = "";
        this._numbersArray = [];

        if (this._intervals === 0) {
            return;
        }

        this._Marks.classList.add("dp-range-marks");

        if (this._stepMode === "scale") {
            this._Marks.classList.add("dp-range-marks-scale");
        } else {
            this._Marks.classList.remove("dp-range-marks-scale");
        }

        for (let i = 0; i <= this._intervals; i++) {
            let title;

            if (this._min === 0) {
                title = Math.round((i / this._intervals) * this._max);
            } else {
                title = Math.round((i * (this._max - this._min)) / this._intervals + this._min);
            }

            const step = this._createArrowStep(title);
            this._Marks.append(step!);
        }
        this._setNumbersVisibility();
    }

    /**
     * @private создаем шаги для интервалов
     * @returns span шаг для интервала
     */
    private _createArrowStep(title: number) {
        if (this._stepMode === "arrow") {
            const step = document.createElement("div");
            const stepArrow = document.createElement("span");
            const stepNumbers = document.createElement("span");

            step.append(stepArrow, stepNumbers);
            step.classList.add("dp-range-step");
            step.setAttribute("title", `${title}`);

            stepArrow.classList.add("dp-range-step-arrow");

            stepNumbers.classList.add("dp-range-step-numbers");
            stepNumbers.textContent = `${title}`;
            this._numbersArray.push(stepNumbers);

            return step;
        } else if (this._stepMode === "scale") {
            const step = document.createElement("div");
            const stepScale = document.createElement("span");
            const stepNumbers = document.createElement("span");

            step.append(stepScale, stepNumbers);
            step.classList.add("dp-range-step");
            step.setAttribute("title", `${title}`);

            stepScale.classList.add("dp-range-step-scale");

            stepNumbers.classList.add("dp-range-step-numbers");
            stepNumbers.textContent = `${title}`;
            this._numbersArray.push(stepNumbers);

            return step;
        }
    }

    /**
     * @private устанавливаем режим компонента
     */
    private _setRangeMode() {
        if (this._double) {
            if (this._valueFirst === this._max) {
                this.value = this._max - 1;
            }

            if (this._valueSecond < this._valueFirst + 1) {
                this.value = [null, this._valueFirst + 1];
            }
        }

        this._SliderSecond.dataset.visible = `${this._double}`;
    }

    /**
     * @private задаем положение компонента
     */
    private _setRangeOrientation() {
        this.dataset.vertical = `${this._vertical}`;

        if (this._vertical) {
            this._leftFirst = 0;
            this._leftSecond = 0;
            this._SliderFirst.style.left = "";
            this._SliderSecond.style.left = "";
        } else {
            this._topFirst = 0;
            this._topSecond = 0;
            this._SliderFirst.style.top = "";
            this._SliderSecond.style.top = "";
        }

        this._setSlidersPosition();
    }

    /**
     * @private задаем видимость интервалов
     */
    private SetMarksVisibility() {
        this._Marks.dataset.visible = `${this._marks}`;
    }

    /**
     * @private задаем видимость числовых значение
     */
    _setNumbersVisibility() {
        for (let numbers of this._numbersArray) {
            numbers.dataset.visible = `${this._numbers}`;
        }
    }

    /**
     * @private добавляем слушатели событий
     */
    private _addEventListeners() {
        this.addEventListener("pointerdown", (e: PointerEvent) => this._handlePointerDown(e));
        this._SliderFirst.addEventListener("dragstart", () => false);
        this._SliderSecond.addEventListener("dragstart", () => false);
        window.addEventListener("pointerup", () => this._handlePointerUp());
        window.addEventListener("pointermove", (e: PointerEvent) => this._handlePointerMove(e));
    }

    /**
     * @private обрабатываем нажатие лкм
     * @param e PointerEvent
     */
    private _handlePointerDown(e: PointerEvent) {
        e.preventDefault();
        const target = e.target as HTMLElement;
        if (!this._vertical) {
            this._handlePointerDownHorizontal(e, target);
        } else {
            this._handlePointerDownVertical(e, target);
        }
    }

    /**
     * @private обрабатываем клик по компоненту в горизонтальном положении
     * @param e PointerEvent
     * @param target - Slider
     */
    private _handlePointerDownHorizontal(e: PointerEvent, target: HTMLElement) {
        if (target === this._SliderFirst) {
            this._sliderFirstIsClicked = true;
            this._shiftX = e.clientX - this._SliderFirst.getBoundingClientRect().left;
        } else if (target === this._SliderSecond) {
            this._sliderSecondIsClicked = true;
            this._shiftX = e.clientX - this._SliderSecond.getBoundingClientRect().left;
        }
    }

    /**
     * @private обрабатываем клик по компоненту в вертикальном положении
     * @param e PointerEvent
     * @param target - Slider
     */
    private _handlePointerDownVertical(e: PointerEvent, target: HTMLElement) {
        if (target === this._SliderFirst) {
            this._sliderFirstIsClicked = true;
            this._shiftY = e.clientY - this._SliderFirst.getBoundingClientRect().top;
        } else if (target === this._SliderSecond) {
            this._sliderSecondIsClicked = true;
            this._shiftY = e.clientY - this._SliderSecond.getBoundingClientRect().top;
        }
    }

    /**
     * @private обрабатываем движение мыши
     * @param e PointerEvent
     */
    private _handlePointerMove(e: PointerEvent) {
        if ((!this._sliderFirstIsClicked && !this._sliderSecondIsClicked) || this._disabled) {
            return;
        }

        this._calculateSlidersPosition(e);
    }

    /**
     * @private высчитываем позицию слайдера
     * @param e PointerEvent
     */
    private _calculateSlidersPosition(e: PointerEvent) {
        if (this._sliderFirstIsClicked) {
            this._calculateSliderFirstPosition(e);
        } else {
            this._calculateSliderSecondPosition(e);
        }
    }

    /**
     * @private высчитываем позицию 1-го слайдера
     * @param e PointerEvent
     */
    private _calculateSliderFirstPosition(e: PointerEvent) {
        if (this._vertical) {
            this._calculateSliderFirstPositionVertical(e);
        } else {
            this._calculateSliderFirstPositionHorizontal(e);
        }
    }

    /**
     * @private высчитываем позицию 2-го слайдера
     * @param e PointerEvent
     */
    private _calculateSliderSecondPosition(e: PointerEvent) {
        if (this._vertical) {
            this._calculateSliderSecondPositionVertical(e);
        } else {
            this._calculateSliderSecondPositionHorizontal(e);
        }
    }

    /**
     * @private высчитываем позицию 1-го слайдера в вертикальной ориентации компонента
     * @param e PointerEvent
     */
    private _calculateSliderFirstPositionVertical(e: PointerEvent) {
        let newTop = e.clientY - this._shiftY - this.getBoundingClientRect().top;
        const bottomEdge = this.offsetHeight - this._SliderFirst.offsetHeight;

        if (newTop > bottomEdge) {
            newTop = bottomEdge;
        }

        if (this._double) {
            if (newTop < this._topSecond + 1) {
                newTop = this._topSecond + 1;
            }
        }

        if (newTop < 0) {
            newTop = 0;
        }

        this._SliderFirst.style.top = newTop + "px";
        this._topFirst = newTop;
    }

    /**
     * @private высчитываем позицию 1-го слайдера в горизонтальной ориентации компонента
     * @param e PointerEvent
     */
    private _calculateSliderFirstPositionHorizontal(e: PointerEvent) {
        let newLeft = e.clientX - this._shiftX - this.getBoundingClientRect().left;

        if (newLeft < 0) {
            newLeft = 0;
        }

        if (this._double) {
            if (newLeft > this._leftSecond - 1) {
                newLeft = this._leftSecond - 1;
            }
        }

        const rightEdge = this.offsetWidth - this._SliderFirst.offsetWidth;
        if (newLeft > rightEdge) {
            newLeft = rightEdge;
        }

        this._SliderFirst.style.left = newLeft + "px";
        this._leftFirst = newLeft;
    }

    /**
     * @private высчитываем позицию 2-го слайдера в вертикальной ориентации компонента
     * @param e PointerEvent
     */
    private _calculateSliderSecondPositionVertical(e: PointerEvent) {
        let newTop = e.clientY - this._shiftY - this.getBoundingClientRect().top;
        const bottomEdge = this.offsetHeight - this._SliderSecond.offsetHeight;

        if (newTop > bottomEdge) {
            newTop = bottomEdge;
        }

        if (newTop > this._topFirst - 1) {
            newTop = this._topFirst - 1;
        }

        if (newTop < 0) {
            newTop = 0;
        }

        this._SliderSecond.style.top = newTop + "px";
        this._topSecond = newTop;
    }

    /**
     * @private высчитываем позицию 2-го слайдера в горизонтальной ориентации компонента
     * @param e PointerEvent
     */
    private _calculateSliderSecondPositionHorizontal(e: PointerEvent) {
        let newLeft = e.clientX - this._shiftX - this.getBoundingClientRect().left;

        if (newLeft < 0) {
            newLeft = 0;
        }

        if (newLeft < this._leftFirst + 1) {
            newLeft = this._leftFirst + 1;
        }

        const rightEdge = this.offsetWidth - this._SliderSecond.offsetWidth;
        if (newLeft > rightEdge) {
            newLeft = rightEdge;
        }

        this._SliderSecond.style.left = newLeft + "px";
        this._leftSecond = newLeft;
    }

    /**
     * @private обрабатываем отпускание лкм
     */
    private _handlePointerUp() {
        if (!this._sliderFirstIsClicked && !this._sliderSecondIsClicked) {
            return;
        }

        this._setSlidersValues();
        this._dispatchChangedEvent();
        this._setSlidersTitle();
    }

    /**
     * @private задаем новые value слайдеров
     */
    private _setSlidersValues() {
        if (this._sliderFirstIsClicked) {
            this._setSliderFirstValue();
        } else {
            this._setSliderSecondValue();
        }
    }

    /**
     * @private задаем новое value 1-го слайдера
     */
    private _setSliderFirstValue() {
        if (this._vertical) {
            this._setSliderFirstValueVertical();
        } else {
            this._setSliderFirstValueHorizontal();
        }
    }

    /**
     * @private задаем новое value 2-го слайдера
     */
    private _setSliderSecondValue() {
        if (this._vertical) {
            this._setSliderSecondValueVertical();
        } else {
            this._setSliderSecondValueHorizontal();
        }
    }

    /**
     * @private задаем новое value 1-го слайдера в вертикальной ориентации компонента
     */
    private _setSliderFirstValueVertical() {
        if (this._min === 0) {
            const value = Math.round(
                ((this._trackLength - this._topFirst) / this._trackLength) * this._max
            );

            this.value = value;
            this._changeSliderFirstZIndex();
            this._sliderFirstIsClicked = false;
        } else {
            const value = Math.round(
                ((this._trackLength - this._topFirst) / this._trackLength) * (this._max - this._min) +
                this._min
            );

            this.value = value;
            this._changeSliderFirstZIndex();
            this._sliderFirstIsClicked = false;
        }
    }

    /**
     * @private задаем новое value 1-го слайдера в горизонтальной ориентации компонента
     */
    private _setSliderFirstValueHorizontal() {
        if (this._min === 0) {
            const value = Math.round((this._leftFirst / this._trackLength) * this._max);

            this.value = value;
            this._changeSliderFirstZIndex();
            this._sliderFirstIsClicked = false;
        } else {
            const value = Math.round(
                (this._leftFirst * (this._max - this._min)) / this._trackLength + this._min
            );

            this.value = value;
            this._changeSliderFirstZIndex();
            this._sliderFirstIsClicked = false;
        }
    }

    /**
     * @private задаем новое value 2-го слайдера в вертикальной ориентации компонента
     */
    private _setSliderSecondValueVertical() {
        if (this._min === 0) {
            const value = Math.round(
                ((this._trackLength - this._topSecond) / this._trackLength) * this._max
            );

            this.value = [null, value];
            this._sliderSecondIsClicked = false;
        } else {
            const value = Math.round(
                ((this._trackLength - this._topSecond) / this._trackLength) * (this._max - this._min) +
                this._min
            );

            this.value = [null, value];
            this._sliderSecondIsClicked = false;
        }
    }

    /**
     * @private задаем новое value 2-го слайдера в горизонтальной ориентации компонента
     */
    private _setSliderSecondValueHorizontal() {
        if (this._min === 0) {
            const value = Math.round((this._leftSecond / this._trackLength) * this._max);

            this.value = [null, value];
            this._sliderSecondIsClicked = false;
        } else {
            const value = Math.round(
                (this._leftSecond * (this._max - this._min)) / this._trackLength + this._min
            );

            this.value = [null, value];
            this._sliderSecondIsClicked = false;
        }
    }

    /**
     * @private задаем z-index первого слайдера в зависимости от его позиции, чтобы он не застрял под вторым слайдером
     */
    private _changeSliderFirstZIndex() {
        let difference;
        const sliderStyle = this._SliderFirst.style as any;

        if (!this._vertical) {
            difference = this.offsetWidth - this._leftFirst;
        } else {
            difference = this._topFirst;
        }

        if (difference < 26) {
            sliderStyle["z-index"] = "1";
        } else {
            sliderStyle["z-index"] = "0";
        }
    }

    /**
     * @private Диспатчим событие changed
     */
    private _dispatchChangedEvent() {
        const eventChanged = new Event("changed", {
            bubbles: true,
        });

        this.dispatchEvent(eventChanged);
    }

    /**
     * @private устанавливаем новое значение слайдеров
     * @param value - новое значение слайдеров
     */
    private _setValue(value: number | string | Array<number | null>) {
        if (typeof value === "string" || typeof value === "number") {
            const newValue = Number(value) as number;
            this._setValueFirst(newValue);
        } else {
            if (value[0] && value[1]) {
                if (value[0] > value[1] - 1 && this._double) {
                    throw new Error(
                        "Значение 1-го слайдера не может быть больше значения 2-го слайдера. Минимальная разница между значения равна 1"
                    );
                }

                this._setValueFirst(value[0]);
                this._setValueSecond(value[1]);
            } else if (value[0]) {
                if (value[0] > this._valueSecond - 1 && this._double) {
                    throw new Error(
                        "Значение 1-го слайдера не может быть больше значения 2-го слайдера. Минимальная разница между значения равна 1"
                    );
                }

                this._setValueFirst(value[0]);
            } else if (value[1]) {
                if (value[1] < this._valueFirst + 1 && this._double) {
                    throw new Error(
                        "Значение 1-го слайдера не может быть больше значения 2-го слайдера. Минимальная разница между значения равна 1"
                    );
                }

                this._setValueSecond(value[1]);
            }
        }
    }

    /**
     * @private устанавливаем новое значение первого слайдера
     * @param value - новое значение valueFirst
     */
    private _setValueFirst(value: number) {
        const oldValue = this._valueFirst;

        if (value === oldValue) {
            return;
        }

        if (value > this._max) {
            this.value = [this._max - 1, null];
        } else if (value < this._min) {
            this.value = [this._min, null];
        } else {
            this._valueFirst = value;
        }

        this._setSlidersTitle();
        this._setSliderFirstPosition();
    }

    /**
     * @private устанавливаем новое значение первого слайдера
     * @param value - новое значение valueSecond
     */
    private _setValueSecond(value: number) {
        const oldValue = this._valueSecond;

        if (value === oldValue) {
            return;
        }

        if (value > this._max) {
            this.value = [null, this._max];
        } else if (value < this._min) {
            this.value = [null, this._min + 1];
        } else {
            this._valueSecond = value;
        }

        this._setSlidersTitle();
        this._setSliderSecondPosition();
    }

    /**
     * @private устанавливаем новое значение min
     * @param value - новое значение min
     */
    private _setMin(value: number) {
        const oldValue = this._min;
        if (value === oldValue) {
            return;
        }

        this._min = value;

        if (this._valueFirst < this._min) {
            if (this._valueSecond < this._min) {
                this.value = [this._min, this._min + 1];
            }

            this.value = this.min;

            this._setSlidersTitle();
        }

        this._setSlidersPosition();
        this._setIntervalsElement();
    }

    /**
     * @private устанавливаем новое значение max
     * @param value - новое значение max
     */
    private _setMax(value: number) {
        const oldValue = this._max;

        if (value === oldValue) {
            return;
        }

        this._max = value;

        if (this._valueSecond > this._max) {
            if (this._valueFirst > this._max) {
                this.value = [this._max - 1, this._max];
            }

            this.value = [null, this.max];

            this._setSlidersTitle();
        }

        this._setSlidersPosition();
        this._setIntervalsElement();
    }

    /**
     * @private устанавливаем новое значение disabled
     * @param value - новое значение disabled
     */
    private _setDisabled(value: boolean) {
        if (typeof value === "boolean") {
            const oldValue = this._disabled;

            if (value === oldValue) {
                return;
            }

            this._disabled = value;

            this._setSlidersDisabled();
        } else {
            this._setDisabled(value === "true" ? true : false);
        }
    }

    /**
     * @private устанавливаем новое значение marks
     * @param value - новое значение marks
     */
    private _setMarks(value: boolean) {
        if (typeof value === "boolean") {
            const oldValue = this._marks;

            if (value === oldValue) {
                return;
            }

            this._marks = value;

            this.SetMarksVisibility();
        } else {
            this._setMarks(value === "true" ? true : false);
        }
    }

    /**
     * @private устанавливаем новое значение numbers
     * @param value - новое значение numbers
     */
    private _setNumbers(value: boolean) {
        if (typeof value === "boolean") {
            const oldValue = this._numbers;

            if (value === oldValue) {
                return;
            }

            this._numbers = value;

            this._setNumbersVisibility();
        } else {
            this._setNumbers(value === "true" ? true : false);
        }
    }

    /**
     * @private устанавливаем новое значение double
     * @param value - новое значение double
     */
    private _setDouble(value: boolean) {
        if (typeof value === "boolean") {
            const oldValue = this._double;

            if (value === oldValue) {
                return;
            }

            this._double = value;

            this._setRangeMode();
        } else {
            this._setDouble(value === "true" ? true : false);
        }
    }

    /**
     * @private устанавливаем новое значение intervals
     * @param value - новое значение intervals
     */
    private _setIntervals(value: number) {
        const oldValue = this._intervals;

        if (value === oldValue) {
            return;
        }

        this._intervals = value >= 0 ? value : 0;

        this._setIntervalsElement();
    }

    /**
     * @private устанавливаем новое значение stepMode
     * @param value - новое значение stepMode
     */
    private _setStepMode(value: string) {
        const oldValue = this._stepMode;

        if (value === oldValue) {
            return;
        }

        this._stepMode = value;
        this._setIntervalsElement();
    }

    /**
     * @private устанавливаем новое значение vertical
     * @param value - новое значение vertical
     */
    private _setVertical(value: boolean) {
        if (typeof value === "boolean") {
            const oldValue = this._vertical;

            if (value === oldValue) {
                return;
            }

            this._vertical = value;
            this._setRangeOrientation();
        } else {
            this._setVertical(value === "true" ? true : false);
        }
    }

    //#region геттеры и сеттеры

    get value(): Array<number> {
        return [this._valueFirst, this._valueSecond];
    }

    set value(value: number | string | Array<number | null>) {
        this._setProperty("value", value);
    }

    get min(): number {
        return this._min;
    }

    set min(min: number) {
        this._setProperty("min", min);
    }

    get max(): number {
        return this._max;
    }

    set max(max: number) {
        this._setProperty("max", `${max}`);
    }

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(disabled: boolean) {
        this._setProperty("disabled", `${disabled}`);
    }

    get double(): boolean {
        return this._double;
    }

    set double(double: boolean) {
        this._setProperty("double", `${double}`);
    }

    get intervals(): number {
        return this._intervals;
    }

    set intervals(intervals: number) {
        this._setProperty("intervals", `${intervals}`);
    }

    get stepMode(): string {
        return this._stepMode;
    }

    set stepMode(stepMode: string) {
        this._setProperty("stepMode", `${stepMode}`);
    }

    get vertical(): boolean {
        return this._vertical;
    }

    set vertical(vertical: boolean) {
        this._setProperty("vertical", `${vertical}`);
    }

    get marks(): boolean {
        return this._marks;
    }

    set marks(marks: boolean) {
        this._setProperty("marks", `${marks}`);
    }

    get numbers(): boolean {
        return this._numbers;
    }

    set numbers(numbers: boolean) {
        this._setProperty("numbers", `${numbers}`);
    }
    //#endregion геттеры и сеттеры
}
);

customElements.define("dataplat-action-button", class DataPlatActionButton extends HTMLElement {
    private _icon: string;
    private _iconReplace: string;
    private _add: boolean;
    private _action: string;
    private _disabled: boolean;

    public isRender: boolean;

    private _hasChildren: boolean;
    private _isMenuOpen: boolean;

    private _buttons: Array<HTMLButtonElement>;
    private _selectedId: string;
    private _selectedAction: string;

    private _Button: HTMLButtonElement;
    private _Menu: HTMLDivElement | undefined;

    constructor() {
        super();

        this._icon = "";
        this._iconReplace = "";
        this._add = false;
        this._action = "";
        this._disabled = false;

        this.isRender = false;

        this._hasChildren = false;
        this._isMenuOpen = false;

        this._buttons = [];
        this._selectedId = "";
        this._selectedAction = "";

        this._Button = document.createElement("button");
    }

    connectedCallback() {
        const readyState = document.readyState;

        if (readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this._checkIsRendered());
        } else {
            this._checkIsRendered();
        }
    }

    static get observedAttributes() {
        return ["disabled"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = "") {
        switch (name) {
            case "disabled":
                this._setDisabled(newValue);
                break;
            case "action":
                this._setAction(newValue);
                break;
        }
    }

    /**
     * @private проверка перед рендером, для предотвращения повторного рендера
     */
    private _checkIsRendered() {
        if (!this.isRender) {
            this._render();
            this.isRender = true;
        }
    }

    /**
     * @private рендер компонента
     */
    private _render() {
        this._checkProperties();
        this._createIconElement();
        this._setButton();
        this._setMenu();

        this.classList.add("dp-action-button");
        this.append(this._Button);
        this._addEventListeners();
    }

    /**
     * @private получаем значения атрибутов
     */
    private _checkProperties() {
        DPElements.Global.CheckProperty(this, "icon", false, false);
        DPElements.Global.CheckProperty(this, "iconReplace", false, false);
        DPElements.Global.CheckProperty(this, "add", false, false);
        DPElements.Global.CheckProperty(this, "action");
        DPElements.Global.CheckProperty(this, "disabled");
    }

    /**
     * @private настраиваем кнопку
     */
    private _setButton() {
        this._Button.classList.add("dp-action-button-main");
        this._Button.setAttribute("type", "button");
    }

    /**
     * @private создаем иконку
     */
    private _createIconElement() {
        if (this._add) {
            this._createSpriteIcon("add");
        } else if (this._icon && this._icon !== "") {
            this._createIcon(this._icon);
            if (this._iconReplace && this._iconReplace !== "") {
                this._createIcon(this._iconReplace);
                this.dataset.iconReplace = "true";
            }
        }
    }

    /**
     * @private создаем иконку
     * @param iconPath - id иконки в спрайте или base64 строка
     */
    private _createIcon(iconPath: string) {
        const isSpriteIcon = !this._icon.includes("base64");

        if (isSpriteIcon) {
            this._createSpriteIcon(iconPath);
        } else {
            this._createBase64Icon(iconPath);
        }
    }

    /**
     * @private - создаем иконку по id иконки в спрайте
     * @param iconPath
     */
    private _createSpriteIcon(iconPath: string) {
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

        use.setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            `/images/svg/dpicons.svg#${iconPath}`
        );

        icon.classList.add("dp-action-button-icon");
        icon.append(use);

        this._Button.append(icon);
    }

    /**
     * @private создаем иконку по base64 строке
     * @param iconPath
     */
    private _createBase64Icon(iconPath: string) {
        const icon = document.createElement("img");
        icon.classList.add("dp-action-button-icon");
        icon.src = iconPath;

        this._Button.append(icon);
    }

    /**
     * @private настраиваем контекстное меню
     */
    private _setMenu() {
        const list = this.querySelector("ul");

        if (!list) {
            this._hasChildren = false;
            return;
        }

        this._hasChildren = true;

        let listItems = [...list.querySelectorAll("li")] as Array<HTMLLIElement>;

        listItems = this._deleteExtraChildren(listItems);
        this._buttons = [...this.querySelectorAll("button")] as Array<HTMLButtonElement>;

        list.classList.add("dp-action-button-list");
        this._addChildrenClasses(listItems);

        this._createMenu();
        this._setInitialAnimation(listItems);

        this._Menu!.append(list);
        document.body.append(this._Menu!);
    }

    /**
     * @private удаляем лишние listItems. их количество не должно превышать 6 элем.
     * @param listItems - массив с дочерними listItems
     * @returns обновленный массив listItems
     */
    _deleteExtraChildren(listItems: Array<HTMLLIElement>) {
        for (let [i, li] of listItems.entries()) {
            if (i === 6) {
                console.error("Количество дочерних кнопок не должно превышать 6 элем.");
            }

            if (i > 5) {
                li.remove();
            }
        }

        return listItems.splice(0, 6);
    }

    /**
     * @private задаем видимость меню
     */
    private _setMenuVisibility() {
        this._Menu!.dataset.visible = `${this._isMenuOpen}`;
    }

    /**
     * @private добавляем классы дочерним кнопкам и элементам списка
     * @param listItems - дочерние элементы списка
     * @param buttons - дочерние кнопки
     */
    private _addChildrenClasses(listItems: Array<HTMLLIElement>) {
        let title;

        for (let li of listItems) {
            li.classList.add("dp-action-button-item");

            const text = li.querySelector("p");
            title = text!.textContent;

            text!.classList.add("dp-action-button-text");
            text!.setAttribute("title", `${title}`);
        }

        for (let button of this._buttons) {
            button.classList.add("dp-action-button-sub");
            button.setAttribute("title", `${title}`);

            const icon = button.querySelector("svg") ?? button.querySelector("img");

            icon!.classList.add("dp-action-button-icon");
            icon!.classList.add("small");
        }
    }

    /**
     * @private создаем меню
     */
    private _createMenu() {
        this._Menu = document.createElement("div");
        this._Menu.classList.add("dp-action-button-menu");
        this._setMenuVisibility();
        this._Menu.addEventListener("click", (e: MouseEvent) => this._handleMenuClick(e));
    }

    /**
     * @private обрабатываем клик по меню. если клик произошел по дочерней кнопке - диспатчим событие changed
     * @param e MouseEvent
     */
    private _handleMenuClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const button = target.closest("button");

        if (!button) {
            return;
        }

        const isButton = this._buttons.indexOf(button) !== -1;

        if (!isButton) {
            return;
        }

        if (button.disabled) {
            return;
        }

        this._selectedId = button.id || "";
        this._selectedAction = button.dataset.action || "";

        this._dispatchChangedEvent();

        if (button.dataset.action) {
            this._dispatchActionEvent(button.dataset.action);
        }
    }

    /**
     * @private задаем начальную анимацию для меню. Иначе анимация для меню снизу компонента в первый раз отрабатывает не правильно.
     * @param listItems - массив детей меню
     */
    private _setInitialAnimation(listItems: Array<HTMLLIElement>) {
        const elementRect = this.getBoundingClientRect();
        const menuHeight = listItems.length * 32 + (listItems.length - 1) * 10;

        if (menuHeight < elementRect.top - 10) {
            this._Menu!.dataset.reverse = "false";
        } else if (menuHeight < document.documentElement.clientHeight - elementRect.bottom - 10) {
            this._Menu!.dataset.reverse = "true";
        } else {
            this._Menu!.dataset.reverse = "false";
        }
    }

    /**
     * @private добавляем слушателей событий
     */
    private _addEventListeners() {
        this.addEventListener("click", () => this._handleClick());
    }

    /**
     * @private обрабатываем клик по компоненту
     */
    private _handleClick() {
        if (this._hasChildren) {
            this._handleHasChildrenClick();
        } else {
            this._handleNoChildrenClick();
        }
    }

    /**
     * @private обрабатываем клик по компоненту с дочерними элементами
     */
    private _handleHasChildrenClick() {
        this._isMenuOpen = !this._isMenuOpen;
        this.dataset.open = `${this._isMenuOpen}`;

        this._setMenuVisibility();

        const coord = new DPElements.Coordinate(this, this._Menu!);
        const menuLeft = coord.left + coord.width - coord.popupWidth - 4;
        let menuTop;

        if (coord.popupHeight < coord.top - 10) {
            menuTop = coord.top - coord.popupHeight - 10;
            this._Menu!.dataset.reverse = "false";
        } else if (coord.popupHeight < coord.distanceOnBottom - 10) {
            menuTop = coord.top + coord.height + 10;
            this._Menu!.dataset.reverse = "true";
        } else {
            menuTop = coord.top - coord.popupHeight - 10;
            this._Menu!.dataset.reverse = "false";
        }

        this._Menu!.style.top = `${menuTop}px`;
        this._Menu!.style.left = `${menuLeft}px`;
    }

    /**
     * @private обрабатываем клик по компоненту без дочерних элементов
     * @param e MouseEvent
     */
    private _handleNoChildrenClick() {
        if (this._disabled) {
            return;
        }

        this._selectedId = this.id || "";
        this._selectedAction = this.action || "";

        this._dispatchChangedEvent();

        if (this.action) {
            this._dispatchActionEvent(this.action);
        }
    }

    /**
     * @private Диспатчим событие changed
     */
    private _dispatchChangedEvent() {
        const eventChanged = new Event("changed", {
            bubbles: true,
        });

        this.dispatchEvent(eventChanged);
    }

    /**
     * @private Диспатчим событие значение дата-атрибута кнопки
     * @param action - значение дата-атрибута кнопки, по которой произошел клик
     */
    private _dispatchActionEvent(action: string) {
        const eventAction = new Event(`dp${action}`, {
            bubbles: true,
        });

        this.dispatchEvent(eventAction);
    }

    /**
     * @public блокировка/включение дочерней кнопки компонента
     * @param action - значение атрибута action кнопки, которую нужно заблокировать/включить
     * @param status - true - для блокировки, false для включения
     */
    public _disable(action: string, status: boolean) {
        const button = this._buttons.find(
            (button) => button.getAttribute("action") === action || button.dataset.action === action
        ) as HTMLButtonElement;

        button!.disabled = status;
    }

    //#region методы для SetProperty
    /**
     * @private Задаем значение блокировки элемента(главной кнопки)
     * @param value - новое значение блокировки
     */
    private _setDisabled(value: boolean) {
        if (typeof value === "boolean") {
            this._disabled = value;
            this._Button.disabled = value;
        } else {
            this._setDisabled(value === "true" ? true : false);
        }
    }

    /**
     * @private Задаем значение action компонента/dataset-action атрибута главной кнопки
     * @param value значение action компонента/dataset-action главной кнопки
     */
    _setAction(value: string) {
        this._action = value;
        this._Button.dataset.action = value;
    }

    //#endregion методы для SetProperty

    //#region геттеры и сеттеры
    get icon(): string {
        return this._icon;
    }

    get iconReplace(): string {
        return this._iconReplace;
    }

    get add(): boolean {
        return this._add;
    }

    get action(): string {
        return this._action;
    }

    set action(value: string) {
        this._setProperty("action", value);
    }

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty("disabled", value);
    }

    get selectedId(): string {
        return this._selectedId;
    }

    get selectedAction(): string {
        return this._selectedAction;
    }
    //#endregion
}
);

customElements.define('dataplat-context', class DataplatContext extends HTMLElement {
    isRender: boolean;

    private _dataSource: DPDataSource | null;
    private _buttons: Array<HTMLButtonElement>;
    private _actions: Array<String>;
    // private _parents: Array<HTMLElement>;
    private _activeButton: HTMLElement | undefined;
    private _openedSub: HTMLElement | undefined;
    private _isClickOnContent: boolean;

    private _isOpen: boolean;
    private _isSubMenu: boolean;

    private _dataTextField: string;
    private _dataIconField: string;
    private _dataActionField: string;
    private _dataDisabledField: string;
    private _dataIdField: string;
    private _dataParentIdField: string;
    private _dataContentField: string;
    private _target: string | boolean;
    private _event: string;
    private _direction: string;
    private _subDirection: string;
    private _hoverDelay: number;
    private _alignToAnchor: boolean;
    private _disabled: boolean;
    private _action: string;
    private _select: any;
    private _ignoreClass: string;
    private _active: boolean;

    private _TargetElement: HTMLElement | null;
    private _ContextList: HTMLElement | undefined;
    private _ContextMenu: HTMLElement | undefined;

    constructor() {
        super();
        this.isRender = false;
        this._isOpen = false;
        this._isClickOnContent = false;

        this._isSubMenu = false;
        this._dataSource = null;
        this._buttons = [];
        this._actions = [];

        this._action = '';
        this._active = false;
        this._select = null;
        this._target = '';
        this._direction = 'right';
        this._subDirection = 'right';
        this._hoverDelay = 100;
        this._alignToAnchor = false;
        this._disabled = false;
        this._event = 'contextmenu';
        this._dataTextField = 'name';
        this._dataIconField = 'icon';
        this._dataActionField = 'action';
        this._dataDisabledField = 'disabled';
        this._dataIdField = 'id';
        this._dataParentIdField = 'parentId';
        this._dataContentField = 'content';
        this._ignoreClass = 'none';

        this._TargetElement = null;
    }

    connectedCallback() {
        if (!this.isRender) {
            this._ContextMenu = this as HTMLElement;
            this._ContextMenu?.classList.add('dp-context-menu');

            const readyState = document.readyState!;

            if (readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this._initialize();
                    this._events('loaded');
                    this.isRender = true;
                });
            } else {
                this._initialize();
                this._events('loaded');
                this.isRender = true;
            }
        }
    }

    disconnectedCallback() {
        this._ContextMenu?.remove();
        this._ContextList?.remove();
    }

    static get observedAttributes() {
        return ['disabled'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'disabled':
                if (typeof newValue === 'boolean') {
                    this.Disable('all', newValue);
                } else {
                    if (newValue === 'true') this.Disable('all', true);
                    if (newValue === 'false') this.Disable('all', false);
                }
                break;
            case 'dataSource':
                if (newValue instanceof DPDataSource) {
                    this.isRender ? this.SetData(newValue) : (this._dataSource = newValue);
                } else {
                    throw new Error('переданное значение для dataSource не является экземпляром объекта DPDataSource');
                }
                break;
            case 'select':
                this._setSelect(newValue);
                break;
            default:
                break;
        }
    }

    /** Инициализация компоненты после загрузки DOM */
    private _initialize() {
        const listItem = this.querySelector('.dp-menu-list-item');
        this._handlerParams();
        if (listItem) {
            this._handlerContent();
        } else if (this.dataSource?.data?.list?.length) {
            this._checkSchemaModel();
            this._createList();
            this._subscribeToMethods();
        }
        this._setTarget();
        this._handlerProperty();
        this._checkOnUniqActions();
    }

    /** Обработка параметров */
    private _handlerParams() {
        DPElements.Global.CheckProperty(this, 'dataSource');
        DPElements.Global.CheckProperty(this, 'dataTextField', false);
        DPElements.Global.CheckProperty(this, 'dataActionField', false);
        DPElements.Global.CheckProperty(this, 'dataIconField', false);
        DPElements.Global.CheckProperty(this, 'dataDisabledField', false);
        DPElements.Global.CheckProperty(this, 'direction', false);
        DPElements.Global.CheckProperty(this, 'subDirection', false);
        DPElements.Global.CheckProperty(this, 'alignToAnchor', false);
        DPElements.Global.CheckProperty(this, 'event', false);
        DPElements.Global.CheckProperty(this, 'target', false);
        DPElements.Global.CheckProperty(this, 'active', false);
        DPElements.Global.CheckProperty(this, 'hoverDelay', false);
        DPElements.Global.CheckProperty(this, 'ignoreClass', false);
    }

    /** Обработка свойств */
    private _handlerProperty() {
        DPElements.Global.CheckProperty(this, 'disabled');
        DPElements.Global.CheckProperty(this, 'select');
    }

    /**
     * Закрывает контекстное меню при клике вне его
     * @param e - событие указателя
     */
    private _clickOutsideBlock = (e: Event) => {
        const target = e.target as HTMLElement;
        let cond = false;
        let content = target.closest('.dp-menu-list-item') as HTMLElement;
        if (content) {
            cond = !target.closest('.dp-menu-toggle-check') &&
                !target.closest(`.${this._ignoreClass}`) &&
                !target.closest('.dp-menu-list') &&
                !target.closest('.dp-menu-sublist');
        } else {
            cond = !target.closest('.dp-menu-toggle-check') && !target.closest(`.${this._ignoreClass}`);
        }

        if (cond) {
            if (this._event === 'click' && target !== this._TargetElement) {
                this.Close();
            } else if (this._event !== 'click') {
                this.Close();
            }
        }
    };

    /** Проверка на наличие модели в схеме dataSource */
    private _checkSchemaModel() {
        if (this._dataSource?.data?.schema?.model) {
            this._dataIdField = this._dataSource.idParam;
            this._dataParentIdField = this._dataSource.parentIdParam;
            this._handlerModelProperty(this._dataSource.data.schema.model);
        } else {
            if (this._dataSource?.data) {
                this._dataSource.data.schema = this._getSchema();
                this._dataSource.Schema();
            }
        }
    }

    /** Обработка модели данных, полученная из разметки в виде data-model */
    private _handlerDataModel() {
        let schema: any;
        if (this._ContextMenu?.dataset.model) {
            const model = JSON.parse(this._ContextMenu.dataset.model);

            if (model[0]) {
                schema = this._getSchema(model[0]);
                this._handlerModelProperty(model[0]);
            } else {
                schema = this._getSchema(model);
                this._handlerModelProperty(model);
            }
            this._ContextMenu?.removeAttribute('data-model');
            return schema;
        } else {
            return null;
        }
    }

    /**
     * Обработка свойств модели данных
     * @param model - модель данных
     */
    private _handlerModelProperty(model: any) {
        if (model.name) this._dataTextField = model.name;
        if (model.icon) this._dataIconField = model.icon;
        if (model.disabled) this._dataDisabledField = model.disabled;
        if (model.action) this._dataActionField = model.action;
    }

    /**
     * Получение схемы для dataSource
     * @param model - модель данных
     */
    private _getSchema(model?: any) {
        if (model?.id) this._dataIdField = model.id;
        if (model?.parentId) this._dataParentIdField = model.parentId;

        return {
            model: {
                id: this._dataIdField,
                parentId: this._dataParentIdField
            }
        };
    }

    /** Обработка контента во время инициализации */
    private _handlerContent() {
        const data: any = [];
        const schema = this._handlerDataModel();
        this._ContextList = this.querySelector('.dp-menu-list') as HTMLElement;
        this._ContextList?.addEventListener('click', (e) => this._clickOnButtons(e));
        const buttons = this.querySelectorAll('.dp-menu-toggle-check');
        if (buttons) {
            for (let btn of buttons) {
                const button = btn as HTMLButtonElement;
                const uid = DPElements.Global.NewGuid();
                const text = button.querySelector('.dp-menu-toggle-text') as HTMLSpanElement;

                let model: any = {
                    [this._dataIdField]: button.parentElement?.dataset.id,
                    [this._dataParentIdField]: button.parentElement?.dataset.parentid,
                    [this._dataTextField]: text.innerText,
                    [this._dataActionField]: button.dataset.action,
                    [this._dataDisabledField]: button.disabled,
                    ['uid']: uid
                };

                this._buttons.push(button);

                if (button.dataset.action) {
                    data[this._dataActionField] = button.dataset.action;
                    this._actions.push(button.dataset.action);
                }

                let dataModel = new DPElements.DataItem(model);

                const item = button.parentElement as HTMLLIElement;
                if (item?.classList.contains('dp-menu-list-item')) {
                    item.dataset.uid = uid;
                    dataModel.DataElement = item;
                    this._checkSubMenu(item);
                }

                data.push(dataModel);
            }
        }
        if (schema) {
            this._dataSource = new DPDataSource({
                list: [],
                schema: schema
            });
        } else {
            this._dataSource = new DPDataSource({ list: [] });
        }

        this.dataSource!.data.list = data;

        this._checkIcon();
        this._subscribeToMethods();
    }

    /** Проверка наличие подменю */
    private _checkSubMenu(item: HTMLLIElement) {
        const subMenu = item.querySelector('.dp-menu-sublist') as HTMLElement;
        if (subMenu) {
            this._addEventsSubMenu(item);
            const button = item.querySelector('.dp-menu-toggle-check') as HTMLElement;

            if (item.dataset.uid) subMenu.dataset.parent = item.dataset.uid;

            button.insertAdjacentHTML('beforeend', `<svg class='dp-menu-icon-next'><use xlink:href='${DPElements.IconPath + 'back'}'></use></svg>`);
            subMenu.style.setProperty('--transition-submenu', `${this.hoverDelay}ms`);
        }
    }


    /** Создаем список элементов */
    private _createList() {
        if (this._ContextMenu) {
            this._ContextMenu.innerHTML = '';
            this._ContextList = document.createElement('ul');
            this._ContextList.classList.add('dp-menu-list');
            this._ContextList.addEventListener('click', (e) => this._clickOnButtons(e));
            this._ContextMenu.append(this._ContextList);
            this._ContextList.innerHTML = '';
            for (let model of this._dataSource!.data.list) {
                if (!model[this._dataParentIdField]) {
                    this._ContextList.append(this._createListItem(model));
                }
            }
        }
        this._checkIcon();
        this._events('dataload');
    }

    /**
     * Создаем элемент списка
     * @param model - модель элемента
     */
    private _createListItem(model: any) {
        let item = document.createElement('li');
        item.classList.add('dp-menu-list-item');
        model.DataElement = item;
        if (model['uid']) {
            item.dataset.uid = model['uid'];
        }
        if (model[this._dataContentField]) {
            item.append(model[this._dataContentField]);
            item.dataset.content = 'true';
        } else {
            const button = this._createButton(model);
            const text = this._createText(model);

            if (model[this._dataIconField]) {
                if (model[this._dataIconField].includes('<svg>')) {
                    this._createSvgIcon(button, model[this._dataIconField]);
                } else if (model[this._dataIconField].length < 20) {
                    button.append(this._createSpriteIcon(model[this._dataIconField]));
                } else if (model[this._dataIconField].length > 20) {
                    button.append(this._createImgIcon(model[this._dataIconField]));
                }
            }

            this._buttons.push(button as HTMLButtonElement);
            if (model.type === 'checkbox') {
                button.append(this._createCheckBox(model));
            } else {
                button.append(text);
            }
            item.append(button);

            this._createParentList(model, button);
        }
        return item;
    }

    /** Проверка на одинаковые action */
    private _checkOnUniqActions() {
        if (this._actions.length) {
            const uniqActions = Array.from(new Set(this._actions));
            if (uniqActions.length !== this._buttons.length) {
                this._ContextList?.classList.add('dp-context-menu-error');
                console.error('Имеются одинаковые action');
            }
        }
    }

    /**
     * При условии, что у модели есть children, мы создаем подменю.
     * @param model - модель элемента
     * @param button - кнопка элемента меню
     */
    private _createParentList(model: any, button: HTMLButtonElement) {
        if (this._ContextList) {
            let children = this._checkChildren(model);
            if (children.length) {
                this._createSubMenu(children, model);
                this._addEventsSubMenu(model.DataElement);
                button.insertAdjacentHTML('beforeend', `<svg class='dp-menu-icon-next'><use xlink:href='${DPElements.IconPath + 'back'}'></use></svg>`);
            }
        }
    }

    /**
     * Добавляем слушатели событий при наведение мыши на элемент, у которого есть подменю
     * @param item - элемент меню
     */
    private _addEventsSubMenu(item: HTMLLIElement) {
        let time: number;
        let timeLeave: number;
        item?.addEventListener('pointerenter', (e: any) => {
            clearTimeout(timeLeave);
            time = setTimeout(() => {
                this._toggleSubMenu(e);
            }, this._hoverDelay);
        });
        item?.addEventListener('pointerleave', (e: any) => {
            clearTimeout(time);
            timeLeave = setTimeout(() => {
                this._toggleSubMenu(e, false);
            }, this._hoverDelay);
        });
    }

    /**
     * Открываем или закрываем подменю
     * @param e - событие
     * @param open - false - закрыть подменю
     */
    private _toggleSubMenu(e: PointerEvent, open: boolean = true) {
        const item = e.target as HTMLLIElement;
        if (item?.classList.contains('dp-menu-list-item')) {
            const subList = item.querySelector('.dp-menu-sublist') as HTMLElement;
            if (subList) {
                if (this._openedSub && open) {
                    if (this._openedSub.parentElement?.dataset.uid !== item.dataset.uid) {
                        this._isClickOnContent = false;
                        this._openedSub.dataset.open = 'false';
                    }
                }
                if (open) this._openedSub = subList;
                if (!open) {
                    if (!this._isClickOnContent) {
                        subList.dataset.open = 'false';
                    }
                } else {
                    subList.dataset.open = String(open);
                }

                if (open) {
                    this._setCoordinateSubMenu(item, subList);
                }

            }
        }
    }

    /**
     * Создаем подменю
     * @param children - массив дочерних элементов
     * @param model - модель родительского элемента
     */
    private _createSubMenu(children: Array<any>, model: any) {
        const item = model.DataElement;
        if (!item) return;

        const subList = item.querySelector('.dp-menu-sublist') || this._createSubList(model);
        for (let child of children) {
            if (subList) {
                subList.append(this._createListItem(child));
                item.append(subList);
            }
        }
    }

    /**
     * Создаем список подменю
     * @param model - модель родительского элемента
     */
    private _createSubList(model: any) {
        let subList = document.createElement('ul');
        subList.classList.add('dp-menu-sublist');
        if (this.dataSource) subList.dataset.parent = model.uid;

        return subList;
    }

    /**
     * Проверяем наличие дочерних элементов, при их присутствии добавляем их в массив
     * @param model - модель родительского элемента
     */
    private _checkChildren(model: any) {
        let child = [];

        if (this._dataSource?.data?.list?.length) {
            if (model[this._dataSource.idParam]) {
                for (let data of this._dataSource.data.list) {
                    if (data[this._dataSource.parentIdParam] === model[this._dataSource.idParam]) {
                        child.push(data);
                    }
                }
            }
        }

        return child;
    }

    /**
     * Создаем checkbox элементы
     * @param model - модель элемента
     */
    private _createCheckBox(model: any) {
        let checkbox = document.createElement('dataplat-checkbox') as any;
        checkbox.text = model[this._dataTextField];

        if (model.value) {
            checkbox.value = true;
        }

        return checkbox;
    }

    /**
     * Создаем кнопку элемента списка
     * @param model - модель элемента
     */
    private _createButton(model: any) {
        let button = document.createElement('button');
        button.classList.add('dp-menu-toggle-check');
        if (model[this._dataActionField]) {
            button.dataset.action = model[this._dataActionField];
            this._actions.push(model[this._dataActionField]);
        }
        if (model[this._dataDisabledField]) {
            button.disabled = true;
        } else {
            model[this._dataDisabledField] = false;
        }

        return button;
    }

    /**
     * Создаем текстовое содержимое элемента списка
     * @param model - модель элемента
     */
    private _createText(model: any) {
        let buttonText = document.createElement('span');
        buttonText.classList.add('dp-menu-toggle-text');
        if (model[this._dataTextField]) buttonText.innerText = model[this._dataTextField];

        return buttonText;
    }

    /**
     * Создаем иконку svg
     * @param id - id иконки из svg спрайта
     */
    private _createSpriteIcon(id: string) {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');

        use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `${DPElements.IconPath + id}`);

        icon.classList.add('dp-menu-icon');
        icon.append(use);

        return icon;
    }

    /**
     * Создаем иконку img
     * @param url - url иконки
     */
    private _createImgIcon(url: string) {
        const icon = document.createElement('img');
        icon.classList.add('dp-menu-icon');
        icon.src = url;

        return icon;
    }

    /**
     * Создаем иконку svg на основе пришедшей разметки из БД
     * @param button - кнопка
     * @param svg - разметка HTML
     */
    private _createSvgIcon(button: HTMLElement, svg: HTMLElement) {
        const arrow = button.querySelector('.dp-treeview-button-arrow') as HTMLSpanElement;
        if (arrow) {
            arrow.insertAdjacentHTML('afterend', `${svg}`);
        } else {
            button.insertAdjacentHTML('afterbegin', `${svg}`);
        }

        const icon = button.querySelector('svg');
        if (icon) icon.classList.add('dp-menu-icon');
    }

    /**
     * Событие анимации при закрытии меню
     * @param e - событие указателя
     */
    private _animationEvent = (e: AnimationEvent) => {
        if (e.animationName === 'context-close') {
            this._ContextMenu!.dataset.active = 'false';
            this._events('deactivate');
        }
    };

    /**
     * Анимация открытия меню
     * @param coord - true - переданы координаты
     * @param e - событие указателя
     * @param x - координата по оси X
     * @param y - координата по оси Y
     */
    private _animationOpen = (coord: boolean = false, e?: PointerEvent | MouseEvent | null, x?: number, y?: number) => {
        setTimeout(() => {
            if (!coord && e) this._useOpenMethods(e);
            if (coord && x && y) {
                this._open(x, y);
                this._checkPosition();
            }
        }, 130);
    };

    /**
     * Переключаем состояние меню, открытие или закрытое
     * @param e - событие мыши
     */
    private _toggleMenu(e: PointerEvent | MouseEvent) {
        e.preventDefault();
        if (this._ContextMenu) {
            if (this._isOpen) {
                this.Close();
                if (this._event === 'contextmenu') {
                    this._animationOpen(false, e);
                }
            } else {
                this._useOpenMethods(e);
            }
        }
    }

    /**
     * Используем методы для открытия меню и расчета позиции
     * @param e - событие мыши
     */
    private _useOpenMethods(e: PointerEvent | MouseEvent) {
        this._open();
        this._setCoordinate(e);
        this._checkPosition();
    }

    /** Открываем меню */
    private _open(x?: number, y?: number) {
        if (this._ContextMenu) {
            this._events('open');
            this._isOpen = true;
            this._ContextMenu!.style.animation = 'context-open 0.15s ease';
            this._ContextMenu!.dataset.active = 'true';
            window.addEventListener('click', this._clickOutsideBlock, {
                capture: true
            });
            this._ContextMenu!.removeEventListener('animationend', this._animationEvent);
            this._events('active');

            if (x && y) {
                this._ContextMenu.style.left = x + 'px';
                this._ContextMenu.style.top = y + 'px';
            }
        }
    }

    /**
     * Задаем координаты
     * @param e - событие мыши
     */
    private _setCoordinate(e: PointerEvent | MouseEvent) {
        const posMouseX = e.clientX;
        const posMouseY = e.clientY;

        if (this._ContextMenu) {
            if (this.alignToAnchor) {
                if (this._TargetElement) {
                    const coordinateTarget = new DPElements.Coordinate(this._TargetElement, this._ContextMenu);
                    switch (this.direction) {
                        case 'right':
                            this._ContextMenu.style.left = coordinateTarget.left + coordinateTarget.width + 'px';
                            this._ContextMenu.style.top = coordinateTarget.top + 'px';
                            break;
                        case 'left':
                            if (coordinateTarget.popupWidth) {
                                this._ContextMenu.style.left = coordinateTarget.left - coordinateTarget.popupWidth + 'px';
                            }
                            this._ContextMenu.style.top = coordinateTarget.top + 'px';
                            break;
                        case 'top':
                            this._ContextMenu.style.left = coordinateTarget.left + 'px';
                            this._ContextMenu.style.bottom = coordinateTarget.distanceOnBottom + coordinateTarget.height + 'px';
                            break;
                        case 'bottom':
                            this._ContextMenu.style.left = coordinateTarget.left + 'px';
                            this._ContextMenu.style.top = coordinateTarget.top + coordinateTarget.height + 'px';
                            break;
                    }
                }
            } else {
                this._ContextMenu.style.left = posMouseX + 10 + 'px';
                this._ContextMenu.style.top = posMouseY + 10 + 'px';
            }
        }
    }

    /**
     * Задаем координаты
     * @param listItem - элемент списка
     * @param subMenu - подменю
     */
    private _setCoordinateSubMenu(listItem: HTMLElement, subMenu: HTMLElement) {
        if (subMenu && this._ContextMenu) {
            const coordinateItemList = new DPElements.Coordinate(listItem);
            const coordinateTarget = new DPElements.Coordinate(this._ContextMenu);
            if (this.subDirection === 'right') {
                subMenu.style.top = coordinateItemList.top - coordinateTarget.top - 2 + 'px';
                subMenu.style.left = coordinateItemList.width + 'px';
                if (subMenu.offsetWidth > coordinateTarget.distanceOnRight) {
                    subMenu.style.left = 0 - subMenu.offsetWidth + 'px';
                }
            } else if (this.subDirection === 'left') {
                subMenu.style.top = coordinateItemList.top - coordinateTarget.top - 2 + 'px';
                subMenu.style.left = 0 - subMenu.offsetWidth + 'px';
                if (subMenu.offsetWidth - coordinateTarget.left > 0) {
                    subMenu.style.left = coordinateItemList.width + 'px';
                }
            }
        }
    }

    /**
     * Проверяем позицию элемента относительно краев экрана
     * @param e - событие мыши или указателя
     * @param main - главное меню, по умолчанию true, false - под меню
     */
    private _checkPosition(e?: PointerEvent | MouseEvent, main: boolean = true) {
        if (this._ContextMenu) {
            const coordinate = new DPElements.Coordinate(this._ContextMenu);
            if (coordinate.bottom > coordinate.windowHeight) {
                this._ContextMenu.style.top = coordinate.top - (coordinate.bottom - window.innerHeight) + 'px';
            }
            if (coordinate.right > window.innerWidth) {
                this._ContextMenu.style.left = 'auto';
                this._ContextMenu.style.right = 0 + 'px';
            }
            if (coordinate.left < 0) {
                this._ContextMenu.style.left = 0 + 'px';
            }
        }
    }

    /** Проверяем на наличие иконок у элементов */
    private _checkIcon() {
        let isIconAll = false;
        if (this._buttons) {
            for (let btn of this._buttons) {
                let nextElem = btn.nextElementSibling;
                if (btn.children.length > 1 && !nextElem || (nextElem && btn.children.length > 2)) {
                    isIconAll = true;
                    break;
                }
            }
            for (let btn of this._buttons) {
                let nextElem = btn.nextElementSibling;
                if ((btn.children.length < 2 || (btn.children.length < 3 && nextElem)) && isIconAll) {
                    btn.style.paddingLeft = 40 + 'px';
                }
            }
        }


        if (this._dataSource?.data?.list?.length) {
            for (let model of this._dataSource.data.list) {
                if (!model[this._dataParentIdField]) {
                    const item = model.DataElement;
                    let isIcon = false;
                    const subMenu = item?.lastElementChild as HTMLElement;
                    if (subMenu?.classList.contains('dp-menu-sublist')) {
                        const buttons = subMenu.querySelectorAll('.dp-menu-toggle-check');
                        if (buttons.length) {
                            for (let key of buttons) {
                                const btn = key as HTMLElement;
                                btn.removeAttribute('style');
                                if (btn.children.length > 1) {
                                    isIcon = true;
                                    break;
                                }
                            }
                            for (let key of buttons) {
                                const btn = key as HTMLElement;
                                if (btn.children.length < 2 && isIcon) {
                                    btn.style.paddingLeft = 40 + 'px';
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Метод при клике на кнопку
     * @param e - событие мыши
     */
    private _clickOnButtons(e: Event) {
        const button = e.target as any;
        const item = button?.parentElement as HTMLLIElement;
        if (item.classList.contains('dp-menu-list-item')) {
            if (item.closest('.dp-menu-sublist')) {
                this._isClickOnContent = true;
            }
            if (!item.querySelector('.dp-menu-sublist')) {
                if (item.dataset.uid) {
                    const model = this._dataSource?.GetByUid(item.dataset.uid);
                    if (model) {
                        this._setActiveButton(model, true);
                        this._select = model;
                        if (model[this._dataActionField]) {
                            this._action = model[this._dataActionField];
                        }
                        if (model.type === 'checkbox') {
                            const checkbox = button.querySelector('dataplat-checkbox');
                            if (checkbox) {
                                checkbox.value = !checkbox.value;
                                this._select.value = checkbox.value;
                            }
                        } else {
                            this.Close();
                        }
                        this._events('changed');
                        this._actionEvent(e);
                    }
                }
            }
        } else if (item.closest('.dp-menu-sublist')) {
            this._isClickOnContent = true;
        }
    }

    /**
     * Подсвечиваем активную кнопку
     * @param model - модель элемента
     * @param onclick
     */
    private _setActiveButton(model: any, onclick: boolean = false) {
        const item = model.DataElement;
        if (this._active) {
            if (item) {
                if (!item.querySelector('dataplat-checkbox')) {
                    if (onclick) {
                        if (this._select?.uid === model.uid) {
                            if (this._activeButton) {
                                if (this._activeButton.dataset.selected) {
                                    this._activeButton.removeAttribute('data-selected');
                                    this._activeButton = undefined;
                                }
                            } else {
                                this._setSelected(item);
                            }
                        } else {
                            this._setSelected(item);
                        }
                    } else {
                        this._setSelected(item);
                    }
                }
            }
        }
    }

    private _setSelected(item: HTMLElement) {
        if (this._activeButton) {
            this._activeButton.removeAttribute('data-selected');
        }
        item.dataset.selected = 'true';
        this._activeButton = item;
    }

    /** Устанавливаем цель, в которой будет открываться меню */
    private _setTarget() {
        if (this._target) {
            this._TargetElement = document.getElementById(`${this.target}`);
        } else if (this._target === '') {
            this._TargetElement = this.parentElement;
        }
        if (this._TargetElement) {
            this._TargetElement.addEventListener(`${this.event}`, ((e: PointerEvent | MouseEvent) => {
                const target = e?.target as HTMLElement;
                if (!target.classList.contains('dp-menu-toggle-check')) {
                    this._toggleMenu(e);
                }
            }) as EventListener);
        }
    }

    /** Подписываемся на методы из DPDataSource */
    private _subscribeToMethods() {
        if (this.dataSource) {
            this.dataSource.onAdd = (model: any) => {
                this._addItem(model);
            };
            this.dataSource.onRemove = (model: any) => {
                this._removeItem(model);
            };
        }
    }

    /**
     * Удаляем элемент списка
     * @param model - модель элемента
     */
    private _removeItem(model: any) {
        const item = model.DataElement;
        if (item) {
            item.remove();
        }
        this._buttons = this._buttons.filter((btn) => btn.parentElement?.dataset.uid !== model['uid']);
        this._actions = this._actions.filter((action) => action !== model[this._dataActionField]);
    }

    /**
     * Добавляем элемент в список
     * @param model - модель элемента
     */
    private _addItem(model: any) {
        if (this._dataSource) {
            if (!model[this._dataParentIdField]) {
                this._ContextList?.append(this._createListItem(model));
                this._checkIcon();
                this._checkOnUniqActions();
            } else {
                const parentModel = this._dataSource.GetById(model[this._dataParentIdField]);
                if (parentModel) {
                    const item = parentModel.DataElement;
                    if (item) {
                        const subMenu = item.querySelector('.dp-menu-sublist');
                        if (subMenu) {
                            subMenu.append(this._createListItem(model));
                            this._checkIcon();
                        }
                    }
                }
            }
        }
    }

    /**
     * Задаем значение полю disabled в dataSource
     * @param id - идентификатор элемента
     * @param disabled - true | false
     */
    private _setDisabledOnData(id: string, disabled: boolean) {
        if (this.dataSource) {
            for (let item of this.dataSource.data.list) {
                if (item[this._dataIdField] === id) {
                    item[this.dataDisabledField] = disabled;
                    break;
                }
            }
        }
    }

    /** Обнуление свойств после обновления списка */
    private _resetProperties() {
        this._actions = [];
        this._buttons = [];
        this._action = '';
    }

    /**
     * Выбираем элемент
     * @param value - action элемента или его идентификатор
     */
    private _setSelect(value: string) {
        if (value) {
            let list = this._dataSource?.data?.list;
            if (list.length) {
                for (let model of list) {
                    let param = model[this._dataActionField] || model[this._dataIdField];
                    if (param === value) {
                        if (!model.DataElement?.dataset.parent) {
                            if (model.DataElement) {
                                this._select = model;
                                this._setActiveButton(model);
                            }
                        }
                    }
                }
            }
        } else {
            if (this._activeButton) this._activeButton.dataset.selected = 'false';
            this._select = null;
        }
    }

    // #region доступные методы

    /**
     * Передаем данные в компоненту
     * @param data - объект DPDataSource
     */
    public SetData(data: DPDataSource) {
        this._dataSource = data;
        this._resetProperties();
        this._subscribeToMethods();
        if (this.dataSource?.data?.list) {
            this._checkSchemaModel();
            this._createList();
        } else if (this.dataSource?.data?.transport) {
            if (this.dataSource.data.transport.read) {
                this.dataSource.data.transport.read(() => {
                    this._checkSchemaModel();
                    this._createList();
                });
            }
        }
    }

    /** Открывает меню по переданным координатам */
    public Open(x: number, y: number) {
        if (this._ContextMenu) {
            if (this._isOpen) {
                this.Close();
                this._animationOpen(true, null, x, y);
            } else {
                this._open(x, y);
                this._checkPosition();
            }
        }
    }

    /** Закрывает меню */
    public Close() {
        if (this._ContextMenu) {
            this._events('close');
            this._isOpen = false;
            if (this._openedSub) this._openedSub.dataset.open = 'false';
            this._ContextMenu.style.animation = 'context-close 0.15s ease';
            this._ContextMenu.addEventListener('animationend', this._animationEvent);
            window.removeEventListener('click', this._clickOutsideBlock, {
                capture: true
            });
        }
    }

    /**
     * Включает или отключает элементы меню
     * @param action - параметр data-action кнопки элемента, или список actions
     * @param disabled - true - отключить, false - включить
     */
    public Disable(action: string | Array<string>, disabled: boolean) {
        if (typeof action === 'string') {
            for (let btn of this._buttons) {
                if (action !== 'all') {
                    if (btn.dataset.action === action) {
                        btn.disabled = disabled;
                        this._setDisabledOnData(btn.dataset.action, disabled);
                    }
                } else {
                    btn.disabled = disabled;
                    this._disabled = disabled;
                    this._setDisabledOnData(action, disabled);
                }
            }
        } else if (typeof action === 'object') {
            for (let act of action) {
                for (let btn of this._buttons) {
                    if (btn.dataset.action === act) {
                        btn.disabled = disabled;
                        this._setDisabledOnData(btn.dataset.action, disabled);
                        break;
                    }
                }
            }
        } else {
            throw new Error('переданное значение для Disabled не является строкой или массивом строк');
        }
    }

    /**
     * Поиск элемента по uid
     * @param uid - uid элемента
     * @return - возвращает найденный элемент
     */
    public FindByUid(uid: string) {
        if (typeof uid === 'string') {
            const findItem = this._buttons.find((btn) => btn.dataset.uid === uid);
            if (findItem) return findItem.parentElement;
        } else {
            throw new Error('переданное значение для FindByUid не является строкой');
        }
    }

    // #endregion

    //  #region Кастомные события: loaded, dataload, open, close, activate, deactivate, changed, action

    private _events(type: string) {
        this.dispatchEvent(new Event(`${type}`));
    }

    private _actionEvent(e: Event) {
        let ActionEvent = new CustomEvent('dp' + this._action, {
            bubbles: true,
            detail: { action: this._action, event: e }
        });
        this.dispatchEvent(ActionEvent);
    }

    // #endregion

    // #region set and get

    get dataSource(): DPDataSource | null {
        return this._dataSource ? this._dataSource : null;
    }

    set dataSource(data: DPDataSource | null) {
        this._setProperty('dataSource', data);
    }

    get target(): string | boolean {
        return this._target;
    }

    set target(target: string | boolean) {
        if (!this.isRender) {
            this._target = target;
        }
    }

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', `${value}`);
    }

    get alignToAnchor(): boolean {
        return this._alignToAnchor;
    }

    set alignToAnchor(value: boolean) {
        if (!this.isRender) {
            this._alignToAnchor = value;
        }
    }

    get hoverDelay(): number {
        return this._hoverDelay;
    }

    set hoverDelay(value: number) {
        if (!this.isRender) {
            this._hoverDelay = value;
        }
    }

    get subDirection(): string {
        return this._subDirection;
    }

    set subDirection(value: string) {
        if (!this.isRender) {
            this._subDirection = value;
        }
    }

    get direction(): string {
        return this._direction;
    }

    set direction(value: string) {
        if (!this.isRender) {
            this._direction = value;
        }
    }

    get event() {
        return this._event;
    }

    set event(value: string) {
        if (!this.isRender) {
            this._event = value;
        }
    }

    get dataDisabledField(): string {
        return this._dataDisabledField;
    }

    set dataDisabledField(value: string) {
        if (!this.isRender) {
            this._dataDisabledField = value;
        }
    }

    get dataActionField(): string {
        return this._dataActionField;
    }

    set dataActionField(value: string) {
        if (!this.isRender) {
            this._dataActionField = value;
        }
    }

    get dataIconField(): string {
        return this._dataIconField;
    }

    set dataIconField(value: string) {
        if (!this.isRender) {
            this._dataIconField = value;
        }
    }

    get dataTextField(): string {
        return this._dataTextField;
    }

    set dataTextField(value: string) {
        if (!this.isRender) {
            this._dataTextField = value;
        }
    }

    get dataIdField(): string {
        return this._dataIdField;
    }

    set dataIdField(value: string) {
        if (!this.isRender) {
            this._dataIdField = value;
        }
    }

    get dataContentField(): string {
        return this._dataContentField;
    }

    set dataContentField(value: string) {
        if (!this.isRender) {
            this._dataContentField = value;
        }
    }

    get ignoreClass(): string {
        return this._ignoreClass;
    }

    set ignoreClass(value: string) {
        if (!this.isRender) {
            this._ignoreClass = value;
        }
    }

    get active(): boolean {
        return this._active;
    }

    set active(value: boolean) {
        if (!this.isRender) {
            this._active = value;
        }
    }

    get select(): any {
        return this._select;
    }

    set select(value: any) {
        this._setProperty('select', value);
    }

    get action(): string {
        return this._action;
    }

    get isOpen(): boolean {
        return this._isOpen;
    }

    //  #endregion
});

customElements.define('dataplat-treeview', class DataplatTreeView extends HTMLElement {
    public isRender: boolean;

    private _dataSource: DPDataSource | null;

    private _expandedItems: Array<any>;
    private _nestingLevel: string;
    private _paddingValue: number;
    private _nullGuid: string;
    private _renderObserver: IntersectionObserver | undefined;
    private _observableItem: HTMLLIElement | undefined;
    private _searchObserver: IntersectionObserver | undefined;
    private _treeList: any;
    private _count: number;
    private _isExpandedAll: boolean;
    private _searchText: string;
    private _sumMainItems: number;
    private _hasChildren: boolean;

    private _dataIdField: string;
    private _dataParentIdField: string;
    private _dataChildrenField: string;
    private _dataTextField: string;
    private _dataIconField: string;
    private _secondIconField: string;
    private _dataDisabledField: string;
    private _disabled: boolean;
    private _dragdrop: boolean;
    private _edit: boolean;
    private _state: boolean;
    private _expanded: any;
    private _collapsed: any;
    private _selectedContext: any;
    private _select: any;
    private _move: boolean;
    private _generateIcon: boolean;
    private _position: any;
    private _max: number;
    private _sourceNode: HTMLLIElement | null;
    private _destinationNode: HTMLElement | null;
    private _dropPosition: string | null;
    private _noRecord: string;
    private _moved: Array<any>;

    private _ContextMenu: any;
    private _Component: HTMLElement | undefined;
    private _TreeView: HTMLUListElement | undefined;
    private _ActiveButton: HTMLButtonElement | undefined;
    private _MainItem: HTMLLIElement | undefined;
    private _Loader: HTMLLIElement | undefined;
    private _ParentSourceNode: HTMLLIElement | undefined;
    private _RecordElement: HTMLElement | undefined;
    private _StartedNode: HTMLLIElement | undefined;

    constructor() {
        super();
        this.isRender = false;
        this._dataSource = null;
        this._expandedItems = [];
        this._treeList = [];
        this._nestingLevel = '1';
        this._paddingValue = 18;
        this._nullGuid = '00000000-0000-0000-0000-000000000000';
        this._isExpandedAll = false;
        this._searchText = '';
        this._sumMainItems = 0;
        this._hasChildren = false;

        this._dataIdField = 'id';
        this._dataParentIdField = 'parentId';
        this._dataChildrenField = 'children';
        this._dataTextField = 'name';
        this._dataIconField = 'icon';
        this._secondIconField = 'secondIcon';
        this._dataDisabledField = 'disabled';
        this._disabled = false;
        this._dragdrop = false;
        this._edit = false;
        this._state = true;
        this._move = false;
        this._generateIcon = false;
        this._position = { up: false, down: false };
        this._sourceNode = null;
        this._destinationNode = null;
        this._dropPosition = null;
        this._noRecord = 'Нет данных';
        this._moved = [];
        this._max = 50;
        this._count = 0;
    }

    connectedCallback() {
        if (!this.isRender) {
            this._Component = this as HTMLElement;
            this._Component.classList.add('dataplat-treeview');

            const readyState = document.readyState!;

            if (readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this._initialize();
                    this.Events('loaded');
                    this.isRender = true;
                });
            } else {
                this._initialize();
                this.Events('loaded');
                this.isRender = true;
            }
        }
    }

    static get observedAttributes() {
        return ['disabled', 'select', 'state', 'edit', 'dragdrop', 'move'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'dataSource':
                if (newValue instanceof DPDataSource) {
                    this.isRender ? this.SetData(newValue) : (this._dataSource = newValue);
                } else {
                    throw new Error('переданное значение для dataSource не является экземпляром объекта DPDataSource');
                }
                break;
            case 'select':
                if (typeof newValue === 'string') {
                    this._setSelect(newValue);
                } else {
                    this._setSelect(null, newValue);
                }
                break;
            case 'state':
                if (typeof newValue === 'boolean') {
                    this._setState(newValue);
                } else {
                    if (newValue === 'true') this._setState(true);
                    if (newValue === 'false') this._setState(false);
                }
                break;
            case 'edit':
                if (typeof newValue === 'boolean') {
                    this._setEdit(newValue);
                } else {
                    if (newValue === 'true') this._setEdit(true);
                    if (newValue === 'false') this._setEdit(false);
                }
                break;
            case 'dragdrop':
                if (typeof newValue === 'boolean') {
                    this._setDragAndDrop(newValue);
                } else {
                    if (newValue === 'true') this._setDragAndDrop(true);
                    if (newValue === 'false') this._setDragAndDrop(false);
                }
                break;
            case 'move':
                if (typeof newValue === 'boolean') {
                    this._move = newValue;
                } else {
                    if (newValue === 'true') this._move = true;
                    if (newValue === 'false') this._move = false;
                }
                break;
            case 'disabled':
                if (typeof newValue === 'boolean') {
                    this.Disable('all', newValue);
                } else {
                    if (newValue === 'true') this.Disable('all', true);
                    if (newValue === 'false') this.Disable('all', false);
                }
                break;
            default:
                break;
        }
    }

    /** Инициализация компоненты после загрузки DOM */
    private _initialize() {
        const listItem = this.querySelector('.dp-treeview-item');
        this._handlerParams();
        if (listItem) {
            this._handlerContent();
        } else if (this.dataSource?.data?.list?.length) {
            this._checkSchemaModel();
            this._handleList(this.dataSource.data.list);
            this._createTree();
        } else {
            this._Component?.append(this._createNoRecord());
        }
        this._addEventListeners();
        if (this._edit) this._checkContextMenu();
        this._handlerProperty();
        this._createSearchObserver();
    }

    private _createNoRecord() {
        this._RecordElement = document.createElement('div');
        this._RecordElement.classList.add('dp-treeview-record');
        let paragraph = document.createElement('p');
        paragraph.classList.add('dp-treeview-record-text');
        paragraph.innerText = this._noRecord;
        this._RecordElement.append(paragraph);

        return this._RecordElement;
    }

    /** Добавление слушателей событий компоненту */
    private _addEventListeners() {
        this._Component?.addEventListener('dblclick', (e: MouseEvent) => this._clickOnButtons(e));
        this._Component?.addEventListener('click', (e: MouseEvent) => this._handlerClick(e));
    }

    /** Обработка параметров */
    private _handlerParams() {
        DPElements.Global.CheckProperty(this, 'dataSource');
        DPElements.Global.CheckProperty(this, 'dataIdField', false);
        DPElements.Global.CheckProperty(this, 'dataParentIdField', false);
        DPElements.Global.CheckProperty(this, 'dataChildrenField', false);
        DPElements.Global.CheckProperty(this, 'dataTextField', false);
        DPElements.Global.CheckProperty(this, 'dataIconField', false);
        DPElements.Global.CheckProperty(this, 'dataDisabledField', false);
        DPElements.Global.CheckProperty(this, 'generateIcon', false);
        DPElements.Global.CheckProperty(this, 'max', false);
        DPElements.Global.CheckProperty(this, 'noRecord', false);
    }

    /** Обработка свойств */
    private _handlerProperty() {
        DPElements.Global.CheckProperty(this, 'disabled');
        DPElements.Global.CheckProperty(this, 'select');
        DPElements.Global.CheckProperty(this, 'state');
        DPElements.Global.CheckProperty(this, 'edit');
        DPElements.Global.CheckProperty(this, 'dragdrop');
        DPElements.Global.CheckProperty(this, 'move');
    }

    /** Обработка контента с разметки html */
    private _handlerContent() {
        this._TreeView = this._Component?.querySelector('.dp-treeview') as HTMLUListElement;
        this._handlerItems();
        if (this._dragdrop) {
            this._addDragDropListeners();
        }
    }

    /** Обработка элементов дерева с разметки html */
    private _handlerItems() {
        let data = [];
        const schema = this._handlerDataModel();
        const items = this._Component?.querySelectorAll('.dp-treeview-item');
        if (items?.length) {
            for (let key of items) {
                const item = key as HTMLLIElement;
                if (this._dragdrop) item.draggable = true;
                const button = item.firstElementChild as HTMLButtonElement;
                if (this._edit) button.append(this._createMenuButton());
                const text = button.querySelector('.dp-treeview-text') as HTMLSpanElement;
                let model: any = this._getModel(item, button, text);
                this._handlerImages(button, model);

                model.DataElement = item;
                model.isLoad = true;

                if (item?.parentElement?.classList.contains('dp-treeview')) {
                    item.parentElement!.dataset.level! = String(this._nestingLevel);
                    this._checkChildren(model.DataElement);
                }

                if (item.parentElement?.dataset.level) {
                    model.nestingLevel = +item.parentElement.dataset.level - 1;
                }

                data.push(model);

                if (!item.dataset.parentid || item.dataset.parentid === this._nullGuid) {
                    item.dataset.level = '1';
                }

                item.removeAttribute('data-id');
                item.removeAttribute('data-parentid');
            }
        }

        if (schema) {
            this._dataSource = new DPDataSource({
                list: [],
                schema: schema
            });
        } else {
            this._dataSource = new DPDataSource({ list: [] });
        }

        this.dataSource!.data.list = data;

        this._subscribeToMethods();
    }

    private _checkChildren(item: HTMLElement) {
        const group = item.lastElementChild as HTMLElement;
        if (item.parentElement?.dataset.level) {
            const button = item.firstElementChild as HTMLButtonElement;
            if (button?.classList.contains('dp-treeview-button')) {
                this._setIndent(+item.parentElement.dataset.level, button);

                if (group?.classList.contains('dp-treeview-group')) {
                    button.dataset.parent = 'true';
                    if (!button.firstElementChild?.classList.contains('dp-treeview-button-arrow')) {
                        button.prepend(this._createArrow());
                    }
                    item.dataset.expanded = 'false';
                    group.dataset.level = String(+item.parentElement.dataset.level + 1);
                    const items = group.querySelectorAll('.dp-treeview-item');
                    if (items?.length) {
                        for (let key of items) {
                            const child = key as HTMLElement;
                            this._checkChildren(child);
                        }
                    }
                }
                const parentItem = item.parentElement.parentElement as HTMLElement;
                if (parentItem?.classList.contains('dp-treeview-item')) item.dataset.parentid = parentItem.dataset.id;
            }
        }
    }

    private _handlerImages(button: HTMLButtonElement, model: any) {
        const img = button.querySelector('img') as HTMLImageElement;
        const svg = button.querySelector('svg') as any;
        if (img || svg) {
            if (img) model[this._dataIconField] = img.src;
            if (svg) model[this._dataIconField] = svg.outerHTML;
        } else {
            if (this._generateIcon) {
                const arrow = button.querySelector('.dp-treeview-button-arrow') as HTMLButtonElement;
                if (arrow) {
                    arrow.after(this._generationIcon(model));
                } else {
                    button.prepend(this._generationIcon(model));
                }
            }
        }
    }

    /* #region Работа с моделями и схемой dataSource */
    private _getModel(item: HTMLElement, button: HTMLButtonElement, text: HTMLSpanElement) {
        const uid = DPElements.Global.NewGuid();
        item.dataset.uid = uid;

        let model: any = {
            [this._dataIdField]: item.dataset.id,
            [this._dataParentIdField]: item.dataset.parentid,
            [this._dataTextField]: text.innerText,
            ['uid']: uid
        };

        if (item.dataset.other) {
            const other = JSON.parse(item.dataset.other);
            for (let param in other) {
                model[param] = other[param];
            }
            item.removeAttribute('data-other');
        }


        let newModel: any = new DPElements.DataItem(model);

        if (newModel) {
            if (item?.lastElementChild?.classList.contains('dp-treeview-group')) {
                newModel.expanded = false;
                newModel.hasChildren = true;
            } else {
                newModel.hasChildren = false;
            }

            newModel.disabled = button.disabled;
        }

        return newModel;
    }

    /** Проверка на наличие модели в схеме dataSource */
    private _checkSchemaModel() {
        if (this._dataSource?.data?.schema?.model) {
            this._dataIdField = this._dataSource.idParam;
            this._dataParentIdField = this._dataSource.parentIdParam;
            this._dataChildrenField = this._dataSource.children;
            this._handlerModelProperty(this._dataSource.data.schema.model);
        } else {
            if (this._dataSource?.data) {
                this._dataSource.data.schema = this._getSchema();
                this._dataSource.Schema();
            }
        }
    }

    /** Обработка модели данных, полученная из разметки в виде data-model */
    private _handlerDataModel() {
        let schema: any;
        if (this._Component?.dataset.model) {
            const model = JSON.parse(this._Component.dataset.model);

            if (model[0]) {
                schema = this._getSchema(model[0]);
                this._handlerModelProperty(model[0]);
            } else {
                schema = this._getSchema(model);
                this._handlerModelProperty(model);
            }
            this._Component?.removeAttribute('data-model');
            return schema;
        } else {
            return null;
        }
    }

    /**
     * Обработка свойств модели данных
     * @param model - модель данных
     */
    private _handlerModelProperty(model: any) {
        if (model.name) this._dataTextField = model.name;
        if (model.icon) this._dataIconField = model.icon;
        if (model.secondIcon) this._secondIconField = model.secondIcon;
        if (model.disabled) this._dataDisabledField = model.disabled;
    }

    /**
     * Получение схемы для dataSource
     * @param model - модель данных
     */
    private _getSchema(model?: any) {
        if (model?.id) this._dataIdField = model.id;
        if (model?.parentId) this._dataParentIdField = model.parentId;
        if (model?.children) this._dataChildrenField = model.children;

        return {
            model: {
                id: this._dataIdField,
                parentId: this._dataParentIdField,
                children: this._dataChildrenField
            }
        };
    }

    /* #endregion Работа с моделями и схемой dataSource */

    /**
     * Обрабатываем список данных
     * @param list - список из источника данных dataSource
     */
    private _handleList(list: Array<any>) {
        this._sumMainItems = 0;
        this._hasChildren = false;
        let children: any = {};
        this._treeList = list;
        for (let item of list) {
            if (!item[this._dataParentIdField] || item[this._dataParentIdField] === this._nullGuid) {
                this._sumMainItems++;
                if (item[this._dataChildrenField]) this._hasChildren = true;
            } else if (!this._dataSource?.isTree) {
                if (children[item[this._dataParentIdField]]) {
                    children[item[this._dataParentIdField]].push(item);
                } else {
                    children[item[this._dataParentIdField]] = [item];
                }
            }
        }

        const findChildren = (parent: any) => {
            if (children[parent[this._dataIdField]]) {
                parent.hasChildren = true;
                this._hasChildren = true;
                for (let child of children[parent[this._dataIdField]]) {
                    findChildren(child);
                }
            }
        };

        if (!this._dataSource?.isTree) {
            for (let root of this._treeList) {
                findChildren(root);
            }
        }
    }

    /**
     * Обрабатываем список данных
     * @param model - модель элемента
     * @param name - имя свойства модели
     * @param value - значение свойства
     */
    private _changeDataItem(model: any, name: string, value: any) {
        switch (name) {
            case this._dataTextField:
                this._changeName(model, value);
                break;
            case this._dataIconField:
                this._changeIcon(model);
                break;
            case this._secondIconField:
                this._changeIcon(model, this._secondIconField);
                break;
            case 'expanded':
                this._changeState(model, value);
                break;
            case 'disabled':
                this._setDisabled(model, value);
                break;
            default:
                break;
        }
    }

    /**
     * Изменяем состояние с открыто на закрыто и наоборот
     * @param model - модель элемента
     * @param value - значение свойства
     */
    private _changeState(model: any, value: boolean) {
        const item = model.DataElement as HTMLLIElement;
        if (item) {
            this._setExpandToItem(model, item, value);
        }
    }

    /**
     * Изменяем наименование элемента
     * @param model - модель элемента
     * @param value - значение свойства
     */
    private _changeName(model: any, value: string) {
        const item = model.DataElement as HTMLLIElement;
        if (item) {
            const text = item.querySelector('.dp-treeview-text') as HTMLSpanElement;
            if (text) {
                text.innerText = value;
            }
        }
    }

    /**
     * Изменяем иконку элемента
     * @param model - модель элемента
     * @param value - значение свойства
     * @param field - поле определяющее первая или вторая иконка
     */
    private _changeIcon(model: any, field: string = this._dataIconField) {
        const item = model.DataElement as HTMLLIElement;
        if (item) {
            const button = item.querySelector('.dp-treeview-button') as HTMLButtonElement;
            if (!button) return;

            if (model[field]) {
                this._defineIconType(model, button, field, true);
            } else {
                this._removeIcon(model, field, button);
            }
        }
    }

    /**
     * Определяем тип иконки.
     * @param model - модель элемента
     * @param button - кнопка элемента
     * @param field - поле определяющее первая или вторая иконка 
     * @param isChange - true = иконка динамически изменяется
     */
    private _defineIconType(model: any, button: HTMLButtonElement, field: string, isChange?: boolean) {
        if (model[field].includes('<svg ') && model[field].includes('</svg>')) {
            this._createSvgIcon(button, model[field], field);
        } else if (model[field].includes('data:image')) {
            if (isChange) {
                this._setIcon(model, button, field, 'img');
            } else {
                button.append(this._createImgIcon(model[field], field, button));
            }
        } else {
            if (isChange) {
                this._setIcon(model, button, field, 'svg');
            } else {
                button.append(this._createSpriteIcon(model[field], field, button));
            }
        }
    }

    /**
     * Удаляем иконку, если в значении пришло null.
     * @param model - модель элемента
     * @param button - кнопка элемента
     * @param field - поле определяющее первая или вторая иконка 
     */
    private _removeIcon(model: any, field: string, button: HTMLButtonElement) {
        const icon = this._getIcon(field, button);
        if (!icon) return;

        if (button.getAttribute('data-second')) button.removeAttribute('data-second');

        icon.remove();

        if (field === this._dataIconField) {
            const arrow = button.querySelector('.dp-treeview-button-arrow') as HTMLSpanElement;
            if (arrow) {
                arrow.after(this._generationIcon(model));
            } else {
                button.prepend(this._generationIcon(model));
            }
        }
    }

    /**
     * Изменяем иконку элемента
     * @param model - модель элемента
     * @param button - кнопка элемента
     * @param field - поле определяющее первая или вторая иконка
     * @param type - тип иконки
     */
    private _setIcon(model: any, button: HTMLButtonElement, field: string, type: string) {
        const icon = this._getIcon(field, button);
        if (icon) {
            let iconContent: any;
            if (type === 'svg') iconContent = icon.querySelector('use') as any;
            if (type === 'img') iconContent = icon.tagName === 'IMG' ? icon : null;
            if (iconContent) {
                if (type === 'svg') {
                    iconContent.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `${DPElements.IconPath + model[field]}`);
                } else {
                    iconContent.src = model[field];
                }
            } else {
                if (type === 'svg') if (icon.tagName === 'IMG') icon.remove();
                if (type === 'img') if (icon.querySelector('use')) icon.remove();
                this._createIcon(type, model, button, field);
            }
        } else {
            this._createIcon(type, model, button, field);
        }
    }

    /**
     * Получаем иконку из DOM
     * @param button - кнопка элемента
     * @param field - поле определяющее первая или вторая иконка
     */
    private _getIcon(field: string, button: HTMLButtonElement) {
        if (field === this._dataIconField) {
            return button.querySelector('.dp-treeview-icon') as HTMLElement;
        } else {
            return button.querySelector('.dp-treeview-second-icon') as HTMLElement;
        }
    }

    /**
     * Изменяем состояние блокировки элемента
     * @param model - модель элемента
     * @param value - значение свойства
     */
    private _setDisabled(model: any, value: boolean) {
        const item = model.DataElement as HTMLLIElement;
        if (item) {
            const button = item.querySelector('.dp-treeview-button') as HTMLButtonElement;
            if (button) {
                button.disabled = value;
            }
        }
    }

    /** Создаем дерево */
    private _createTree() {
        if (this.dataSource) {
            this._RecordElement?.remove();
            this._createTreeView();
            let length = this._getLength();
            this._appendItems(length);
            this._Component?.append(this._TreeView!);
            this._subscribeToMethods();
            if (this._dragdrop) this._addDragDropListeners();
            this.Events('dataload');
        }
    }

    /** Создаем контейнер дерева */
    private _createTreeView() {
        if (!this._TreeView) {
            this._TreeView = document.createElement('ul');
            this._TreeView.classList.add('dp-treeview');
            this._TreeView.dataset.level = '1';
        } else {
            this._TreeView.innerHTML = '';
        }
    }

    /**
     * Создаем контейнер дерева
     * @param length - длина допустимого количества элементов для отрисовки
     */
    private _appendItems(length: number) {
        for (let i = 0; i < length; i++) {
            if (this._treeList[i]) {
                if (!this._treeList[i][this._dataParentIdField] || this._treeList[i][this._dataParentIdField] === this._nullGuid) {
                    this._TreeView?.append(this._createItem(this._treeList[i]));
                }
            }
            if (length === this._max && i === this._max - 1) {
                this._setObserverToLastItem(this._treeList[i].DataElement, this._treeList[i]);
            }
        }
    }

    /**
     * Устанавливаем наблюдатель на последний элемент списка
     * @param item - элемент списка
     * @param model - модель элемента
     */
    private _setObserverToLastItem(item: HTMLLIElement, model: any) {
        this._createObserver();
        if (this._renderObserver) {
            this._renderObserver.observe(item);
            this._observableItem = item;
        }
        this._TreeView?.append(this._createLoader());
        model.onLoad = () => {
            if (this._Loader) this._Loader.remove();
        };
    }

    /** Получаем допустимую длину для отрисовки */
    private _getLength() {
        if (this._sumMainItems < 500) {
            return this._sumMainItems;
        } else {
            return this._max;
        }
    }

    /** Ленивая загрузка */
    private _lazyLoading = (entries: any, observer: any) => {
        if (entries[0].isIntersecting || entries[1]?.isIntersecting) {
            observer.unobserve(entries[0].target);
            this._loadItems();
        }
    };

    /** Создаем наблюдатель */
    private _createObserver() {
        this._renderObserver = new IntersectionObserver(this._lazyLoading, {
            threshold: 1
        });
    }

    /** Создаем новые элементы при достижении конца списка */
    private _loadItems() {
        let sum = 0;
        if (this._Loader) this._Loader.remove();
        this._count += this._max;
        sum = this._count + this._max;

        for (let i = this._count; i < sum; i++) {
            if (this._isExpandedAll) {
                this._TreeView?.append(this._createItem(this._treeList[i], true));
            } else {
                this._TreeView?.append(this._createItem(this._treeList[i]));
            }
            if (i === sum - 1) {
                this._renderObserver?.observe(this._treeList[i].DataElement);
                this._observableItem = this._treeList[i].DataElement;
                this._TreeView?.append(this._createLoader());
                this._treeList[i].onLoad = () => {
                    if (this._Loader) this._Loader.remove();
                };
            }
        }
    }

    /** Создаем загрузчик */
    private _createLoader() {
        this._Loader = document.createElement('li');
        this._Loader.classList.add('dp-treeview-loader');
        let block = document.createElement('dataplat-load') as DPElementLoad;
        block.active = true;
        block.text = 'Загрузка списка, подождите...';
        block.size = 'small';

        this._Loader.append(block);

        return this._Loader;
    }

    /**
     * Создаем группу
     * @return group - возвращает созданную группу элементов
     */
    private _createGroup(model: any) {
        let group = document.createElement('ul');
        group.classList.add('dp-treeview-group');
        group.dataset.level = String(+model.nestingLevel + 1);

        return group;
    }

    /**
     * Создаем элемент списка
     * @param model - модель элемента списка
     * @param isExpandAll - true - все элементы должны быть раскрыты
     * @return item - возвращает созданный элемент списка
     */
    private _createItem(model: any, isExpandAll: boolean = false) {
        let item = document.createElement('li');
        item.classList.add('dp-treeview-item');
        item.dataset.uid = model['uid'];
        model.DataElement = item;
        if (this._dragdrop) item.draggable = true;
        item.append(this._createButton(model, model.nestingLevel));

        if (!model[this._dataParentIdField] || model[this._dataParentIdField] === this._nullGuid) {
            item.dataset.level = '1';
            if (this._sumMainItems < 500) {
                this._handleChildren(model, item);
            } else {
                setTimeout(() => {
                    this._handleChildren(model, item);
                }, 0);
            }
        } else {
            this._handleChildren(model, item);
        }

        return item;
    }

    /**
     * Обрабатываем дочерние элементы
     * @param model - модель элемента списка
     * @param item - элемент списка
     * @param isExpandAll - true - все элементы должны быть раскрыты
     */
    private _handleChildren(model: any, item: HTMLLIElement) {
        model.isLoad = true;
        if (model[this._dataChildrenField] || model.hasChildren) {
            this._setItemExpanded(model, item);
            this._createChildrenItems(model);
        }
    }

    /**
     * Присваиваем данные модели и элементу списка
     * @param model - модель элемента списка
     * @param item - элемент списка
     * @param isExpandAll - true - все элементы должны быть раскрыты
     */
    private _setItemExpanded(model: any, item: HTMLLIElement, isExpandAll: boolean = false) {
        item.dataset.expanded = 'false';
        model.hasChildren = true;

        if (isExpandAll) {
            model.expanded = true;
            if (item.dataset.expanded === 'false') {
                this._setExpandToItem(model, item, true);
            }
        }

        if (this._expandedItems.length) {
            for (let id of this._expandedItems) {
                if (id === model[this._dataIdField]) {
                    model.expanded = true;
                    if (item.dataset.expanded === 'false') {
                        this._setExpandToItem(model, item, true);
                    }
                    break;
                }
            }
        }
    }

    private _setExpandToItem(model: any, item: HTMLLIElement, value: boolean) {
        item.dataset.expanded = String(value);
        this._setExpanded(value, model);
    }

    /**
     * Создаем дочерние элементы
     * @param model - модель элемента
     * @param isExpandAll - true - все элементы должны быть раскрыты
     */
    private _createChildrenItems(model: any, isExpandAll: boolean = false) {
        if (model[this._dataChildrenField] || model.hasChildren) {
            const item = model.DataElement;
            if (item) {
                const group = this._createGroup(model);
                item.append(group);

                const children = model[this._dataChildrenField] || this._getChildren(model);
                for (let childModel of children) {
                    childModel.nestingLevel = 1 + model.nestingLevel;
                    group.append(this._createItem(childModel, isExpandAll));
                }
            }
        }
    }

    /**
     * Получаем дочерние элементы
     * @param model - модель элемента списка
     */
    private _getChildren(model: any) {
        let children = [];

        for (let item of this._treeList) {
            if (model[this._dataIdField] === item[this._dataParentIdField]) {
                children.push(item);
            }
        }
        return children;
    }

    /**
     * Создаем кнопку элемента списка
     * @param model - модель элемента списка
     * @param level - уровень вложенности элемента
     * @return button - возвращает созданную кнопку элемента списка
     */
    private _createButton(model: any, level: number) {
        let button = document.createElement('button');
        button.classList.add('dp-treeview-button');
        if (this._state) {
            if (this._hasChildren) this._setIndent(level, button);
        } else {
            if (this._hasChildren) this._setIndent(1, button);
            button.dataset.hide = 'true';
        }
        if (model[this._dataDisabledField]) button.disabled = true;

        if (model[this._dataChildrenField] || model.hasChildren) {
            button.append(this._createArrow());
            this._appendIcon(model, button, this._secondIconField);
            button.dataset.parent = 'true';
        }
        this._appendIcon(model, button, this._dataIconField);
        button.append(this._createText(model));
        if (this._edit) button.append(this._createMenuButton());
        return button;
    }

    /**
     * Добавляем иконку в кнопку
     * @param model - модель элемента списка
     * @param button - возвращает созданную кнопку элемента списка
     * @param field - поле определяющее первая или вторая иконка
     */
    private _appendIcon(model: any, button: HTMLButtonElement, field: string) {
        if (model[field]) {
            this._defineIconType(model, button, field, false);
        } else {
            if (field === this._dataIconField) {
                if (this._generateIcon) button.append(this._generationIcon(model));
            }
        }
    }

    /** Создаем стрелку, для раскрытия и закрытия списка */
    private _createArrow() {
        let arrowButton = document.createElement('span');
        arrowButton.classList.add('dp-treeview-button-arrow');
        return arrowButton;
    }

    /**
     * Создаем текстовое содержимое элемента списка
     * @param model - модель элемента списка
     * @return text - возвращает созданное текстовое содержимое элемента списка
     */
    private _createText(model: any) {
        let text = document.createElement('span');
        text.classList.add('dp-treeview-text');
        text.innerText = model[this.dataTextField];

        return text;
    }

    /**
     * Создаем иконку, если изначально иконка отсутствует
     * @param type - тип иконки
     * @param model - модель элемента
     * @param button - кнопка элемента
     * @param field - поле определяющее первая или вторая иконка
     */
    private _createIcon(type: string = 'svg', model: any, button: HTMLButtonElement, field: string) {
        const arrow = button.querySelector('.dp-treeview-button-arrow') as HTMLSpanElement;
        if (arrow) {
            if (type === 'svg') arrow.after(this._createSpriteIcon(model[field], field, button));
            if (type === 'img') arrow.after(this._createImgIcon(model[field], field, button));
        } else {
            if (type === 'svg') button.prepend(this._createSpriteIcon(model[field], field, button));
            if (type === 'img') button.prepend(this._createImgIcon(model[field], field, button));
        }
        if (this._generateIcon) {
            const generatedIcon = button.querySelector('.dp-treeview-generated-icon');
            if (generatedIcon) generatedIcon.remove();
        }
    }

    /**
     * Создаем иконку svg
     * @param id - id иконки из svg спрайта
     * @param field - поле определяющее первая или вторая иконка
     * @param button - кнопка элемента
     */
    private _createSpriteIcon(id: string, field: string, button: HTMLButtonElement) {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');

        use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `${DPElements.IconPath + id}`);

        this._setIconClass(icon, field, button);
        icon.append(use);

        return icon;
    }

    /**
     * Создаем иконку svg на основе пришедшей разметки из БД
     * @param button - кнопка
     * @param svg - разметка HTML
     * @param field - поле определяющее первая или вторая иконка
     */
    private _createSvgIcon(button: HTMLButtonElement, svg: HTMLElement, field: string) {
        const arrow = button.querySelector('.dp-treeview-button-arrow') as HTMLSpanElement;
        if (arrow) {
            arrow.insertAdjacentHTML('afterend', `${svg}`);
        } else {
            button.insertAdjacentHTML('afterbegin', `${svg}`);
        }

        const icon = button.querySelector('svg');

        if (icon) {
            this._setIconClass(icon, field, button);
        }
    }

    /**
     * Создаем иконку img
     * @param url - url иконки
     * @param field - поле определяющее первая или вторая иконка
     * @param button - кнопка элемента
     */
    private _createImgIcon(url: string, field: string, button: HTMLButtonElement) {
        const icon = document.createElement('img');
        this._setIconClass(icon, field, button);
        icon.src = url;

        return icon;
    }

    /**
     * Назначаем класс иконке
     * @param icon
     * @param field - поле определяющее первая или вторая иконка
     * @param button - кнопка элемента
     */
    private _setIconClass(icon: any, field: string, button: HTMLButtonElement) {
        if (field === this._dataIconField) {
            icon.classList.add('dp-treeview-icon');
        } else {
            icon.classList.add('dp-treeview-second-icon');
            button.dataset.second = 'true';
        }
    }

    /**
     * Создаем иконку, если иконка не передана
     * @param model - модель элемента
     */
    private _generationIcon(model: any) {
        let generatedIcon = document.createElement('span');
        generatedIcon.classList.add('dp-treeview-generated-icon');

        let result = '';
        let text = model[this._dataTextField].split(' ');
        for (let key of text) {
            if (text.length > 1) {
                if (key.substring(0, 1) === '(') {
                    result += key.substring(1, 2);
                } else {
                    result += key.substring(0, 1);
                }
            } else {
                result += key.substring(0, 2);
            }
        }
        generatedIcon.innerText = result.substring(0, 2);
        return generatedIcon;
    }

    /** Проверяем наличие контекстного меню внутри компоненты */
    private _checkContextMenu() {
        this._ContextMenu = this._Component?.querySelector('.dp-context-menu') as HTMLElement;
        if (this._ContextMenu) {
            this._ContextMenu.addEventListener('changed', (e: Event) => {
                const menu = e.target as any;
                if (menu?.action) {
                    this._dispatchMenuEvents(menu.action);
                }
            });
        }
    }

    /** Создаем кнопку для открытия контекстного меню */
    private _createMenuButton() {
        let menuButton = document.createElement('span');
        menuButton.classList.add('dp-treeview-menu-button');

        for (let i = 0; i < 3; i++) {
            let part = document.createElement('span');
            part.classList.add('dp-treeview-menu-button-part');
            menuButton.append(part);
        }

        return menuButton;
    }

    /**
     * Устанавливаем режим редактирования
     * @param value - true - включить режим редактирования, false - выключить
     */
    private _setEdit(value: boolean) {
        if (value !== this._edit) {
            this._edit = value;
            if (this.isRender) {
                if (!this._ContextMenu) this._checkContextMenu();
                if (this._treeList.length) {
                    for (let model of this._treeList) {
                        if (model.DataElement) {
                            const button = model.DataElement.querySelector('.dp-treeview-button') as HTMLButtonElement;
                            this._setEditToItem(button, value);
                            this._findChildren(model, '', 'edit', value);
                        }
                    }
                }
            }
        }
    }

    /** Открываем контекстное меню */
    private _openContextMenu(e: Event) {
        if (this._ContextMenu) {
            const button = e.target as HTMLElement;
            if (button) {
                const item = button.closest('.dp-treeview-item') as HTMLElement;
                if (item?.classList.contains('dp-treeview-item')) {
                    if (this._move) this._checkUpAndDown(item);
                    if (!this._ContextMenu.isOpen || item.dataset?.uid !== this._selectedContext?.uid) {
                        if (this._dataSource?.data?.list) {
                            this._selectedContext = this._dataSource.GetByUid(item.dataset.uid!);
                        }
                        const coordinate = new DPElements.Coordinate(button);
                        if (coordinate) {
                            const x = coordinate.left + coordinate.width + 5;
                            const y = coordinate.top;
                            this._ContextMenu.Open(x, y);
                        }
                    } else {
                        this._ContextMenu.Close();
                    }

                    this.Events('context');
                }
            }
        }
    }

    /**
     * Отправляем кастомное событие с названием action элементов контекстного меню
     * @param action - параметр data-action элемента контекстного меню
     */
    private _dispatchMenuEvents(action: string) {
        this.dispatchEvent(new Event(`list${action}`));
    }

    //#region Drag and Drop

    private _dragStart = (e: DragEvent) => {
        this._StartedNode = undefined;
        setTimeout(() => {
            const item = e.target as HTMLElement;
            if (item.classList.contains('dp-treeview-item')) {
                item.dataset.hide = 'true';
                this._sourceNode = item as HTMLLIElement;

                const parentNode = item?.parentElement?.parentElement as HTMLLIElement;
                if (parentNode?.classList.contains('dp-treeview-item')) {
                    this._ParentSourceNode = parentNode;
                }

                this._destinationNode = item.parentElement as HTMLElement;

                const nextEl = item.nextElementSibling as HTMLLIElement;
                if (nextEl) this._StartedNode = nextEl;

                this.Events('dragstarted');
            }
        }, 0);
    };

    private _dragEnd = (e: DragEvent) => {
        const item = e.target as HTMLElement;
        if (item.classList.contains('dp-treeview-item')) {
            item.dataset.hide = 'false';
            this.Events('dragended');
        }
    };

    private _dragOver = (e: DragEvent) => {
        e.preventDefault();
        const elem = e.target as HTMLElement;
        if (elem.classList.contains('dp-treeview-button')) {
            const elemCoordinate = elem.getBoundingClientRect();
            const center = elemCoordinate.y + elemCoordinate.height / 2;
            if (e.clientY < elemCoordinate.y + 5) {
                elem.dataset.hovered = 'top';
            } else if (e.clientY > elemCoordinate.y - 5 && e.clientY > center + 5) {
                elem.dataset.hovered = 'bottom';
            } else {
                elem.dataset.hovered = 'true';
            }
        }
    };

    private _dragLeave = (e: DragEvent) => {
        const elem = e.target as HTMLElement;
        if (elem.classList.contains('dp-treeview-button')) {
            elem.dataset.hovered = 'false';
        }
    };

    private _dragDrop = (e: DragEvent) => {
        const elem = e.target as HTMLElement;
        if (this._sourceNode && elem.classList.contains('dp-treeview-button')) {
            elem.dataset.hovered = 'false';
            const parentNode = (elem.closest('.dp-treeview-group') as HTMLElement) || (elem.closest('.dp-treeview') as HTMLElement);
            const elemCoordinate = elem.getBoundingClientRect();
            const center = elemCoordinate.y + elemCoordinate.height / 2;
            if (e.clientY < elemCoordinate.y + 5) {
                if (parentNode) {
                    parentNode?.insertBefore(this._sourceNode, elem.parentElement!);
                    this._updateIndent(parentNode, this._sourceNode!);
                    this._dropPosition = 'before';
                    this._findMovedItems();
                    this._destinationNode = parentNode;
                }
            } else if (e.clientY > elemCoordinate.y - 5 && e.clientY > center + 5) {
                if (parentNode) {
                    parentNode?.insertBefore(this._sourceNode, elem.parentElement!.nextElementSibling);
                    this._updateIndent(parentNode, this._sourceNode!);
                    this._dropPosition = 'after';
                    this._findMovedItems();
                    this._destinationNode = parentNode;
                }
            } else {
                this._appendItem(elem);
                this._findMovedItems();
                this._destinationNode = elem.nextElementSibling as HTMLElement;
                this._dropPosition = 'over';
            }
            this._checkMainFolder(this._sourceNode);
            this._changeParentId(this._sourceNode);
            this._findMovedItems();
            this._destinationNode = elem.parentElement;
        } else if (this._sourceNode && elem.classList.contains('dp-treeview')) {

            if (!this._sourceNode.parentElement?.classList.contains('dp-treeview')) {
                this._findMovedItems();
            }

            elem.append(this._sourceNode);
            this._checkMainFolder(this._sourceNode);
            this._updateIndent(elem, this._sourceNode);
            this._changeParentId(this._sourceNode);
            this._destinationNode = elem;
            this._findMovedItems();
            this._dropPosition = 'over';
        }


        if (this._ParentSourceNode) {
            const model = this._dataSource?.GetByUid(this._ParentSourceNode.dataset.uid!);
            if (model) {
                this._checkFolder(model, true);
            }
        }

        if (this._move && this._sourceNode) {
            this._checkUpAndDown(this._sourceNode);
        }

        this.Events('position');
    };

    /** Получаем модели позиции которых изменились */
    private _findMovedItems() {
        this._moved = [];
        let start = null;
        if (this._destinationNode) {
            const children = this._destinationNode.children;
            if (children?.length) {
                for (let i = 0; i < children.length; i++) {
                    const child = children[i] as HTMLLIElement;
                    if (!start && start !== 0) {
                        if (!this._sourceNode?.dataset.uid) return;
                        if (this._StartedNode) {
                            start = this._findAndSetMoved(child, this._StartedNode, i);
                        }
                        if (!start && start !== 0) {
                            start = this._findAndSetMoved(child, this._sourceNode, i);
                        }
                    } else {
                        if (i > start) {
                            const model = this._getMovedModel(child);
                            if (model) this._createMovedModel(model, i);
                        }
                    }
                }
            }
        }
    }

    /**
     * Ищем и создаем модель для массива moved.
     * @param child - DOM элемент списка
     * @param item - начальный узел
     * @param i - индекс
     * @return индекс, если модель успешно создана
     */
    private _findAndSetMoved(child: HTMLLIElement, item: HTMLElement, i: number) {
        if (child.dataset.uid === item!.dataset.uid) {
            const model = this._getMovedModel(child);
            if (model) {
                this._createMovedModel(model, i);
                return i;
            }
        }
    }

    /**
     * Получаем модель элемента, которые поменяли свою позицию.
     * @param child - DOM элемент списка
     */
    private _getMovedModel(child: HTMLLIElement) {
        if (!child.dataset.uid) return;
        const model = this._dataSource?.GetByUid(child.dataset.uid);
        if (model) return model;
    }

    /**
     * Меняем parentId модели после перетаскивания
     * @param item - элемент списка
     */
    private _changeParentId(item: HTMLLIElement) {
        const parent = this._dataParentIdField;
        const id = this._dataIdField;
        const children = this._dataChildrenField;

        const model = this.dataSource?.GetByUid(item.dataset.uid!);

        if (!model) return;

        const parentItem = item.parentElement?.closest('.dp-treeview-item') as HTMLLIElement;

        if (parentItem) {
            const destModel = this.dataSource?.GetByUid(parentItem.dataset.uid!);
            if (destModel) {
                if (model[parent] !== destModel[id]) {
                    if (this._dataSource?.isTree) this._filterChildrenParent(model);
                    model[parent] = destModel[id];
                    if (this._dataSource?.isTree) {
                        if (destModel[children]) {
                            destModel[children].push(model);
                        } else {
                            destModel[children] = [];
                            destModel[children].push(model);
                        }
                    }
                }
            }
        } else {
            if (model[parent] !== null && model[parent] !== this._nullGuid) {
                if (this._dataSource?.isTree) {
                    this._filterChildrenParent(model);
                    this._treeList.push(model);
                }
                model[parent] = null;
                model.isLoad = true;
            }
        }
    }

    private _filterChildrenParent(model: any) {
        const parentModel = this.dataSource?.GetById(model[this._dataParentIdField]);
        if (parentModel) {
            const children = parentModel[this._dataChildrenField];
            if (children) {
                parentModel[this._dataChildrenField] = children.filter((child: any) => {
                    if (child.uid !== model.uid) {
                        return model;
                    }
                });
            }
        } else {
            const index = this._treeList.indexOf(model);
            if (index !== -1) this._treeList.splice(index, 1);
        }
    }

    /**
     * Проверяем элемент списка является ли родителем первого уровня
     * @param item - элемент списка
     */
    private _checkMainFolder(item: HTMLLIElement) {
        if (!item.parentElement?.classList.contains('dp-treeview')) {
            item.removeAttribute('data-state');
            item.removeAttribute('data-level');
        } else {
            item.dataset.level = '1';
        }

        this._changeStateMainFolder(item);
    }

    /**
     * Добавляем элемент в направленный элемент
     * @param button - кнопка элемента, в который необходимо добавить перетаскиваемый элемент
     */
    private _appendItem(button: HTMLElement) {
        const group = button.nextElementSibling as HTMLElement;
        const item = button.parentElement as HTMLLIElement;
        let model: any;
        if (item?.classList.contains('dp-treeview-item')) {
            model = this._dataSource?.GetByUid(button.parentElement!.dataset.uid!);
        }
        if (model) {
            if (!group) {
                const newGroup = this._createGroup(model);
                if (item.classList.contains('dp-treeview-item')) {
                    item.append(newGroup);
                    this._setFolderParams(item, button, model);
                    newGroup.append(this._sourceNode!);
                    this._setLevelGroup(button, newGroup);
                    this._updateIndent(newGroup, this._sourceNode!);
                }
            }

            if (group?.classList.contains('dp-treeview-group')) {
                if (!group.children.length) {
                    this._setFolderParams(item, button, model);
                }
                group.append(this._sourceNode!);
                this._updateIndent(group, this._sourceNode!);
            }
        }
    }

    /**
     * Устанавливаем параметры папки
     * @param item - элемент списка
     * @param button - кнопка элемента
     * @param model - модель элемента
     */
    private _setFolderParams(item: HTMLElement, button: HTMLElement, model: any) {
        item.dataset.expanded = 'false';
        model.expanded = false;
        model.hasChildren = true;
        button.prepend(this._createArrow());
        button.dataset.parent = 'true';
    }

    /**
     * Перевод элемента в другой элемент
     * @param elem - элемент
     * @param group - группа
     */
    private _setLevelGroup(elem: HTMLElement, group: HTMLElement) {
        const parentGroup = (elem.closest('.dp-treeview-group') as HTMLElement) || (elem.closest('.dp-treeview') as HTMLElement);
        if (parentGroup?.dataset.level) {
            group.dataset.level = String(+parentGroup.dataset.level + 1);
        }
    }

    /**
     * Обновляем отступы кнопкам после перетаскивания
     * @param group - группа элементов списка
     * @param item - элемент, у которого обновляются отступы
     */
    private _updateIndent(group: HTMLElement, item: HTMLLIElement) {
        const button = item.firstElementChild as HTMLButtonElement;
        if (button) {
            if (group.dataset.level) {
                this._setIndent(+group.dataset.level, button);
                const model = this._dataSource?.GetByUid(item?.dataset.uid!);
                if (model) model.nestingLevel = +group.dataset.level;
            }
            const childGroup = button.nextElementSibling as HTMLElement;
            if (childGroup) {
                if (childGroup?.classList.contains('dp-treeview-group')) {
                    childGroup.dataset.level = String(+group.dataset.level! + 1);
                    const childItems = childGroup.children;
                    if (childItems.length) {
                        for (let item of childItems) {
                            this._updateIndent(childGroup, item as HTMLLIElement);
                        }
                    }
                }
            }
        }
    }

    /**
     * Устанавливаем режим перемещения
     * @param value - true - включить режим перемещения, false - выключить
     */
    private _setDragAndDrop(value: boolean) {
        if (value !== this._dragdrop) {
            this._dragdrop = value;
            if (this.isRender) {
                if (this._treeList.length) {
                    for (let model of this._treeList) {
                        const item = model.DataElement;
                        if (item) {
                            this._setDragToItem(item, value);
                            this._findChildren(model, '', 'drag', value);
                        }
                    }
                }
            }
        }
    }

    /** Добавление слушателей событий dragAndDrop */
    private _addDragDropListeners() {
        if (this._dragdrop) {
            this._TreeView?.addEventListener('dragstart', this._dragStart);
            this._TreeView?.addEventListener('dragend', this._dragEnd);
            this._TreeView?.addEventListener('dragover', this._dragOver);
            this._TreeView?.addEventListener('dragleave', this._dragLeave);
            this._TreeView?.addEventListener('drop', this._dragDrop);
        }
    }

    /** Удаление слушателей событий dragAndDrop */
    private _removeDragDropListeners() {
        this._TreeView?.removeEventListener('dragstart', this._dragStart);
        this._TreeView?.removeEventListener('dragend', this._dragEnd);
        this._TreeView?.removeEventListener('dragover', this._dragOver);
        this._TreeView?.removeEventListener('dragleave', this._dragLeave);
        this._TreeView?.removeEventListener('drop', this._dragDrop);
    }

    //#endregion Drag and Drop

    /**
     * Обрабатываем Клик по стрелке или кнопке
     * @param e - событие мыши
     */
    private _clickOnButtons(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.classList.contains('dp-treeview-button-arrow') || target.classList.contains('dp-treeview-button')) {
            if (target.dataset.parent || target.classList.contains('dp-treeview-button-arrow')) {
                const item = target.closest('.dp-treeview-item') as HTMLLIElement;
                if (item) {
                    const model = this._dataSource?.GetByUid(item.dataset.uid!);
                    if (item.dataset.expanded === 'false' || !item.dataset.expanded) {
                        if (model.isLoad || !model.isLoad && model.nestingLevel !== 1) {
                            this._toggleFolder(model, item, true);
                        } else if (model.nestingLevel === 1) {
                            this._setItemLoader(model, item);
                        }
                    } else {
                        this._toggleFolder(model, item, false);
                    }
                }
            }
            if (target.classList.contains('dp-treeview-button')) this.Events('dblselect');
        }
    }

    /**
     * Переключаем состояние папки
     * @param model - модель элемента
     * @param item - элемент списка
     * @param value - значение
     */
    private _toggleFolder(model: any, item: HTMLLIElement, value: boolean) {
        item.dataset.expanded = String(value);
        model.expanded = value;
    }

    /**
     * Устанавливаем загрузчик если дочерние элементы еще не прогружены
     * @param model - модель элемента
     * @param item - элемент списка
     */
    private _setItemLoader(model: any, item: HTMLLIElement) {
        const arrow = item.querySelector('.dp-treeview-button-arrow') as HTMLSpanElement;
        if (arrow) {
            if (arrow.dataset.load === 'false' || !arrow.dataset.load) {
                const loader = this._getLoader();
                arrow.append(loader);
                arrow.dataset.load = 'true';
                model.onLoad = () => {
                    this._toggleFolder(model, item, true);
                    loader.remove();
                    arrow.dataset.load = 'false';
                };
            }
        }
    }

    /** Получаем загрузчик */
    private _getLoader() {
        let loader = document.createElement('dataplat-load') as DPElementLoad;
        loader.size = 'small';
        loader.active = true;

        return loader;
    }

    /**
     * Обрабатываем клик по элементу
     * @param e - событие мыши
     */
    private _handlerClick(e: MouseEvent) {
        const button = e.target as HTMLButtonElement;
        if (button.classList.contains('dp-treeview-button')) {
            this._setSelect(null, null, button);
        } else if (button.classList.contains('dp-treeview-button-arrow')) {
            this._clickOnButtons(e);
        } else if (button.classList.contains('dp-treeview-menu-button')) {
            this._openContextMenu(e);
        }
    }

    /**
     * Устанавливаем активный элемент
     * @param id - идентификатор элемента
     * @param model - модель элемента
     * @param button - HTMLButtonElement
     */
    private _setSelect(id?: string | null, model?: any, button?: HTMLButtonElement) {
        if (button) {
            const item = button.parentElement as HTMLElement;
            if (item?.dataset.uid && this._dataSource) {
                const model = this._dataSource.GetByUid(item.dataset.uid);
                if (model) this._setActiveButton(model, false);
            }
        }
        if (id) {
            if (this._dataSource) {
                const model = this._dataSource.GetById(id);
                if (model) {
                    this._setActiveButton(model);
                }
            }
        }
        if (model) {
            this._setActiveButton(model);
        }
    }

    /**
     * Устанавливаем активную кнопку
     * @param model - модель элемента
     * @param isExpanded
     */
    private _setActiveButton(model: any, isExpanded: boolean = true) {
        const item = model.DataElement;
        if (item) {
            if (this._ActiveButton) this._ActiveButton.dataset.active = 'false';
            const button = item.querySelector('.dp-treeview-button') as HTMLButtonElement;
            if (button) {
                button.dataset.active = 'true';
                this._ActiveButton = button;
                this._select = model;
                if (isExpanded) this._expandActiveButton(item, model);
                this._changeStateMainFolder(item);
                this.Events('select');
                if (this._move) {
                    this._checkUpAndDown(item);
                }
            }

            if (this._Component?.getAttribute('select')) {
                this._Component?.removeAttribute('select');
            }
        }
    }

    /**
     * Изменяем состояние папки первого уровня
     * @param item - элемента списка
     */
    private _changeStateMainFolder(item: HTMLLIElement) {
        if (this._MainItem) this._MainItem.removeAttribute('data-state');
        if (!item.dataset.level) {
            const parentItem = item.closest('[data-level="1"]') as HTMLLIElement;
            if (parentItem?.classList.contains('dp-treeview-item')) {
                this._setStateMainFolder(parentItem);
            }
        } else {
            const button = item.firstElementChild as HTMLButtonElement;
            if (!button.dataset.active || button.dataset.active === 'false') {
                if (this._ActiveButton) {
                    if (item.contains(this._ActiveButton)) {
                        this._setStateMainFolder(item);
                    }
                }
            }
        }
    }

    /**
     * Выделяем главную папку
     * @param item - элемента списка
     */
    private _setStateMainFolder(item: HTMLLIElement) {
        item.dataset.state = 'true';
        this._MainItem = item;
    }

	/**
	 * Раскрываем список до активного элемента
	 * @param elem - объект, содержащий узел элемента DOM
	 * @param model - модель элемента
	 */
	private _expandActiveButton(elem: any, model: any) {
        if (!elem) return;
        
		if (elem.dataset.expanded) {
			this.Expand(model.uid, 'uid');
		} else {
			const parentItem = elem.parentElement?.closest('.dp-treeview-item');
			if (parentItem?.classList.contains('dp-treeview-item')) {
				this.Expand(parentItem.dataset.uid, 'uid');
			}
		}
	}

    /**
     * Закрываем или открываем папки
     * @param value - значение параметра, по умолчанию - 'all'
     * @param param - передаваемый параметр
     * @param method - метод, по которому открывается или закрывается дерево, по умолчанию - expand
     */
    private _collapseAndExpand(value: string = 'all', param: string = 'id', method: string = 'expand') {
        let expand = true;
        if (method === 'collapse') expand = false;

        if (value !== 'all') {
            let model: any;
            if (param === 'uid') {
                model = this._dataSource?.GetByUid(value);
            } else {
                model = this._dataSource?.GetById(value);
            }
            if (model) {
                if (model.hasChildren) model.expanded = expand;
                const item = model.DataElement;
                if (item) {
                    const parentItem = item.parentElement?.closest('.dp-treeview-item') as HTMLElement;
                    if (parentItem?.classList.contains('dp-treeview-item')) {
                        this.Expand(parentItem.dataset.uid, 'uid');
                    }
                }
            }
        } else {
            for (let model of this._treeList) {
                if (model.DataElement) {
                    if (model.hasChildren) {
                        model.expanded = expand;
                        this._findChildren(model, '', 'expanded', expand);
                    }
                }
            }
            this._isExpandedAll = expand;
        }
    }

    private _setExpanded(expand: boolean, model: any) {
        if (expand) {
            this._expanded = model;
            this._collapsed = null;
            const foundUid = this._expandedItems.find(id => id === model[this._dataIdField]);
            if (!foundUid) this._expandedItems.push(model[this._dataIdField]);
            this.Events('expand');
        } else {
            this._expanded = null;
            this._collapsed = model;
            let exp = [];
            if (this._expandedItems.length) {
                for (let id of this._expandedItems) {
                    if (model[this._dataIdField] !== id) {
                        exp.push(id);
                    }
                }
                this._expandedItems = exp;
            }
            this.Events('collapse');
        }
    }

    /** Подписываемся на методы из DPDataSource */
    private _subscribeToMethods() {
        if (this.dataSource) {
            this.dataSource.onAdd = (model: any) => this._addItem(model);
            this.dataSource.onRemove = (model: any, models: any) => this._removeItem(model, models);
            this.dataSource.onEdit = (model: any) => this._editItem(model);
            this.dataSource.onChange = (model: any, name: string, value: any) => this._changeDataItem(model, name, value);
        }
    }

    /**
     * @private поднимает или отпускает элемент в дереве
     * @param model - модель выбранного элемента
     * @param moveUp - false - MoveDown, по умолчанию true;
     */
    private _moveUpAndDown(model: any, moveUp: boolean = true) {
        let models: Array<any> = [];
        if (model) {
            const item = model.DataElement;
            if (item) {
                let nearElement: HTMLLIElement | undefined;
                if (moveUp) nearElement = item.previousElementSibling as HTMLLIElement;
                if (!moveUp) nearElement = item.nextElementSibling as HTMLLIElement;
                if (nearElement) {
                    const nearModel = this._dataSource?.GetByUid(nearElement.dataset.uid!);
                    if (nearModel) models.push(nearModel);
                    if (moveUp) {
                        nearElement.before(item);
                    }
                    if (!moveUp) nearElement.after(item);
                    this._checkUpAndDown(item);
                    const parent = item.parentElement;
                    if (parent) {
                        const items = parent.children;
                        models.push(model);
                        this._setMoved(items, models);
                    }
                    return true;
                } else {
                    this._checkUpAndDown(item);
                    return false;
                }
            }
        }
    }

    /**
     * Заполняем массив moved
     * @param items - DOM элемент списка
     * @param models - массив элементов, которые поменяли свою позицию.
     */
    private _setMoved(items: any, models: Array<any>) {
        this._moved = [];
        for (let i = 0; i < items?.length; i++) {
            if (!models?.length) return;
            for (let model of models) {
                if (items[i].dataset.uid === model.uid) {
                    this._createMovedModel(model, i);
                }
            }
        }
    }

    /**
     * Создаем модель для массива moved, позиция которой изменилась.
     * @param model - модель элемента
     * @param i - позиция элемента
     */
    private _createMovedModel(model: any, i: number) {
        let movedItem = {
            [this._dataIdField]: model[this._dataIdField],
            order: i
        };
        this._moved.push(movedItem);
    }


    private _checkUpAndDown(element: HTMLElement) {
        let previousElementSibling = element.previousElementSibling as HTMLElement;
        let nextElementSibling = element.nextElementSibling as HTMLElement;
        previousElementSibling ? (this._position.up = true) : (this._position.up = false);
        nextElementSibling ? (this._position.down = true) : (this._position.down = false);
    }

    /**
     * Удаляем элемент списка
     * @param model - модель элемента
     * @param models - уникальные идентификаторы элементов, которые нужно удалить
     */
    private _removeItem(model: any, models: any) {
        if (models?.length) {
            for (let model of models) {
                this._resetDataItem(model);
                this._checkFolder(model);
            }
        } else {
            this._resetDataItem(model);
            this._checkFolder(model);
        }
    }

    private _resetDataItem(model: any) {
        if (model) {
            const item = model.DataElement;
            if (item) {
                item.remove();
                model.DataElement = undefined;
            }
        }
    }

    /** Проверяем является ли элемент по прежнему папкой после удаления его дочерних компонентов */
    private _checkFolder(itemModel: any, isParent: boolean = false) {
        let model = itemModel;
        if (!isParent) {
            model = this._dataSource?.GetById(itemModel[this._dataParentIdField]);
        }
        if (model) {
            const item = model.DataElement;
            if (item) {
                const group = item.lastElementChild as HTMLUListElement;
                if (group?.classList.contains('dp-treeview-group')) {
                    if (!group.children.length) {

                        model.hasChildren = false;
                        model.expanded = false;

                        const button = item.firstElementChild as HTMLButtonElement;
                        if (button) {
                            const arrow = button.firstElementChild as HTMLSpanElement;
                            if (arrow?.classList.contains('dp-treeview-button-arrow')) {
                                arrow.remove();
                            }
                            button.removeAttribute('data-parent');
                            item.removeAttribute('expanded');
                        }
                    }
                }
            }
        }
    }

    /**
     * Добавляем элемент в список
     * @param model - модель элемента
     */
    private _addItem(model: any) {
        let folder: HTMLElement | undefined;
        if (model[this._dataParentIdField]) {
            const dataModel = this._dataSource?.GetById(model[this._dataParentIdField]);
            if (dataModel) {
                folder = dataModel.DataElement;
                if (folder) {
                    model.nestingLevel = dataModel.nestingLevel + 1;
                    if (dataModel.hasChildren) {
                        const group = folder.lastElementChild as HTMLElement;
                        if (group) {
                            const item = this._createItem(model);
                            group.append(item);
                            const button = item.firstElementChild as HTMLButtonElement;
                            if (button) {
                                this._setIndent(model.nestingLevel, button);
                            }
                        }
                    } else {
                        const parentButton = folder.firstElementChild as HTMLButtonElement;
                        const item = this._createItem(model);
                        const newGroup = this._createGroup(model);
                        folder.append(newGroup);
                        this._setFolderParams(folder, parentButton!, dataModel);
                        newGroup.append(item);
                        this._setLevelGroup(parentButton!, newGroup);

                        const button = item.firstElementChild as HTMLButtonElement;
                        if (button) {
                            this._setIndent(model.nestingLevel, button);
                        }
                    }
                }
            }
        } else {
            if (!this._observableItem) {
                this._TreeView?.append(this._createItem(model));
            }
        }
    }

    /**
     * Устанавливаем отступы для кнопок
     * @param level - уровень вложенности
     * @param button - кнопка элемента списка
     */
    private _setIndent(level: number, button: HTMLButtonElement) {
        button.style.paddingLeft = level * this._paddingValue + 'px';
    }

    /**
     * Редактирует элемент в списке
     * @param model - модель элемента
     */
    private _editItem(model: any) {
        if (!model[this._dataIconField]) {
            if (this._generateIcon) {
                this._generationIcon(model);
            } else {
                const item = model.DataElement as HTMLLIElement;
                if (item) {
                    const icon = item.querySelector('.dp-treeview-icon') as HTMLButtonElement;
                    if (icon) {
                        icon?.remove();
                    }
                }
            }
        }
    }

    /**
     * Устанавливаем состояние дерева
     * @param value - true - показывает все элементы, false - скрывает все элементы кроме стрелки и иконки
     */
    private _setState(value: boolean) {
        if (value !== this._state) {
            this._state = value;
            if (this.isRender) {
                if (this._treeList.length) {
                    for (let model of this._treeList) {
                        const item = model.DataElement;
                        if (item) {
                            const button = item.firstElementChild as HTMLButtonElement;
                            if (button) {
                                this._setStateToItem(model, button, value);
                                this._findChildren(model, '', 'state', value);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Определяет тип метода и какие данные нужно передать для перемещения.
     * @param id - идентификатор элемента
     * @param type - тип метода
     */
    private _setMove(id: string | undefined, type: string = 'up') {
        if (this._move) {
            if (id) {
                const model = this._dataSource?.GetById(id);
                if (model) {
                    if (type === 'up') this._moveUpAndDown(model);
                    if (type === 'down') this._moveUpAndDown(model, false);
                    this.Events('position');
                }
            } else {
                if (this._select) {
                    if (type === 'up') this._moveUpAndDown(this._select);
                    if (type === 'down') this._moveUpAndDown(this._select, false);
                    this.Events('position');
                }
            }
        } else {
            throw new Error('Свойство move имеет значение false');
        }
    }

    /**
     * Поиск элемента по имени
     * @param model - модель элемента
     * @param item - элемент списка
     * @param folders - массив элементов первого уровня
     * @param query - поисковый запрос
     */
    private _searchByName(model: any, item: HTMLLIElement, folders: Array<any>, query: string) {
        if (model[this._dataTextField]) {
            if (model[this._dataTextField].toLowerCase().includes(query.toLowerCase())) {
                this._handleItem(model, item, folders);
            } else {
                const childModel = this._findChildren(model, query, 'find');
                if (childModel) {
                    this._handleItem(childModel, childModel.DataElement, folders);
                }
            }
        }
    }

    /**
     * Поиск элемента по id
     * @param model - модель элемента
     * @param item - элемент списка
     * @param folders - массив элементов первого уровня
     * @param query - поисковый запрос
     */
    private _searchById(model: any, item: HTMLLIElement, folders: Array<any>, query: string) {
        if (model[this._dataIdField] === query) {
            this._handleItem(model, item, folders);
            return model.uid;
        }
    }

    /**
     * Определение состояние элемента, на странице он или нет и передача модели в дальнейшую работу
     * @param model - модель элемента
     * @param item - элемент списка
     * @param folders - массив элементов первого уровня
     */
    private _handleItem(model: any, item: HTMLElement, folders: Array<any>) {
        if (item) {
            if (!item.dataset.found) {
                this._handleLayoutItems(model, item, folders);
            }
        } else {
            this._handleCreatedItems(model, folders);
        }
    }

    /**
     * Обработка элементов, которые есть на странице
     * @param model - модель родительского элемента
     * @param item - элемент списка
     * @param folders - массив элементов первого уровня
     */
    private _handleLayoutItems(model: any, item: HTMLElement, folders: Array<any>) {
        if (model.nestingLevel !== 1) {
            if (item) {
                const parent = item.closest('[data-level="1"]') as HTMLLIElement;
                if (parent?.classList.contains('dp-treeview-item')) {
                    const folder = folders.find(item => item.dataset.uid === parent.dataset.uid);
                    if (!folder) {
                        folders.push(parent);
                    }
                }
            }
        } else {
            if (item) {
                item.dataset.found = 'true';
                folders.push(item);
                return true;
            }
        }
    }

    /**
     * Обработка элементов, которых нет на странице
     * @param model - модель родительского элемента
     * @param folders - массив элементов первого уровня
     */
    private _handleCreatedItems(model: any, folders: Array<any>) {
        if (!model[this._dataParentIdField] || model[this._dataParentIdField] === this._nullGuid) {
            this._createParentItem(model);
            folders.push(model.DataElement);
        } else {
            const parentModel = this._getParentModel(model);
            if (!parentModel.DataElement) {
                this._createParentItem(parentModel, false);
                folders.push(parentModel.DataElement);
            }
        }
    }

    /**
     * Поиск дочерних элементов подходящих по запрос
     * @param model - модель родительского элемента
     * @param found - true - родительский элемент найден
     */
    private _createParentItem(model: any, found: boolean = true) {
        this._TreeView?.append(this._createItem(model));
        const item = model.DataElement;
        if (item) {
            if (found) item.dataset.found = 'true';
            item.dataset.created = 'true';
        }
    }

    /**
     * Поиск дочерних элементов подходящих по запрос
     * @param model - модель родительского элемента
     * @param query - поисковый запрос
     * @param param - параметр определяющий тип метода
     * @param value - значение
     */
    private _findChildren(model: any, query: string, param: string = 'find', value: boolean = false) {
        let children = model[this._dataChildrenField];
        if (children?.length) {
            for (let child of children) {
                switch (param) {
                    case 'find':
                        if (child[this._dataTextField].toLowerCase().includes(query.toLowerCase())) {
                            return child;
                        } else {
                            if (child[this._dataChildrenField]) {
                                const foundChild: any = this._findChildren(child, query, 'find');
                                if (foundChild) return foundChild;
                            }
                        }
                        break;
                    case 'disabled':
                    case 'expanded':
                        if (child.hasChildren) {
                            child[param] = value;
                            if (child[this._dataChildrenField]) {
                                this._findChildren(child, '', param, value);
                            }
                        }
                        break;
                    case 'remove':
                    case 'hide':
                    case 'state':
                    case 'edit':
                    case 'drag':
                        const item = child.DataElement;
                        if (item) {
                            if (param === 'remove') {
                                this._removeAttrs(item);
                                if (query === '') {
                                    if (item.dataset.hide) item.removeAttribute('data-hide');
                                    if (model.expanded && item.dataset.expanded === 'false') {
                                        item.dataset.expanded = 'true';
                                    }
                                }
                            }
                            if (param === 'hide') {
                                if (!item.dataset.found && item.dataset.expanded !== 'true') {
                                    item.dataset.hide = 'true';
                                }
                            }
                            if (param === 'state' || param === 'edit') {
                                const button = item.firstElementChild as HTMLButtonElement;
                                if (button) {
                                    if (param === 'state') this._setStateToItem(child, button, value);
                                    if (param === 'edit') this._setEditToItem(button, value);
                                }
                            }
                            if (param === 'drag') {
                                this._setDragToItem(item, value);
                            }
                            if (child[this._dataChildrenField]) {
                                this._findChildren(child, '', param, value);
                            }
                        }
                        break;
                }
            }
        }
    }

    /**
     * Устанавливаем состояние кнопкам
     * @param model - модель родительского элемента
     * @param button - кнопка элемента списка
     * @param value - значение
     */
    private _setStateToItem(model: any, button: HTMLButtonElement, value: boolean) {
        if (value) {
            button.removeAttribute('data-hide');
            this._setIndent(model.nestingLevel, button);
        } else {
            button.dataset.hide = 'true';
            button.style.paddingLeft = this._paddingValue + 'px';
        }
    }

    /**
     * Устанавливаем режим редактирования кнопкам
     * @param button - кнопка элемента списка
     * @param value - значение
     */
    private _setEditToItem(button: HTMLButtonElement, value: boolean) {
        if (value) {
            if (button) {
                if (!button.lastElementChild?.classList.contains('dp-treeview-menu-button')) {
                    button.append(this._createMenuButton());
                } else {
                    button.removeAttribute('data-edit');
                }
            }
        } else {
            button.dataset.edit = 'false';
        }
    }

    /**
     * Устанавливаем режим перетаскивания элементам
     * @param item - элемент списка
     * @param value - значение
     */
    private _setDragToItem(item: HTMLLIElement, value: boolean) {
        if (value) {
            item.draggable = true;
            this._addDragDropListeners();
        } else {
            item.removeAttribute('draggable');
            this._removeDragDropListeners();
        }
    }

    /**
     * Удаляем атрибуты поиска у элементов
     * @param item - элемент списка
     */
    private _removeAttrs(item: HTMLLIElement) {
        if (item.dataset.found) item.removeAttribute('data-found');
        if (item.dataset.created) item.removeAttribute('data-created');
        if (item.dataset.expanded) item.dataset.expanded = 'false';
    }

    /**
     * Скрываем не найденные элементы списка
     * @param type - hide - скрыть не найденные элементы, '' - скрыть все элементы
     */
    private _hideItems(type: string = 'hide') {
        for (let model of this._treeList) {
            const item = model.DataElement;
            if (item) {
                if (type === 'hide') {
                    if (!item.dataset.found && item.dataset.expanded !== 'true') {
                        item.dataset.hide = 'true';
                    }
                    if (model[this._dataChildrenField]) {
                        this._findChildren(model, '', 'hide');
                    }
                } else {
                    item.dataset.hide = 'true';
                }
            }
        }
        if (this._observableItem) {
            this._renderObserver?.observe(this._observableItem);
        }
    }

    /**
     * Показываем на странице найденные элементы
     * @param folders - массив элементов первого уровня
     * @param query - поисковый запрос
     * @param uid - уникальный идентификатор, если он присутствует, то поиск идет по id элемента
     */
    private _showItems(folders: Array<any>, query: string, uid: string = '') {
        for (let folder of folders) {
            if (folder) {
                const items = folder.querySelectorAll('.dp-treeview-item');
                for (let item of items) {
                    if (folder.dataset.created) {
                        item.dataset.created = 'true';
                    }

                    const text = item.querySelector('.dp-treeview-text') as HTMLSpanElement;
                    if (text) {
                        if (text.innerText.toLowerCase().includes(query.toLowerCase())) {
                            this._showChildren(item);
                        }
                    }

                    if (uid && !folder.dataset.found) {
                        if (item.dataset.uid === uid) {
                            this._showChildren(item);
                        }
                    }
                }
            }
        }
    }

    /**
     * Показываем найденные дочерние элементы или элементы найденных папок
     * @param item - элемент списка
     */
    private _showChildren(item: HTMLLIElement) {
        item.dataset.found = 'true';
        item.removeAttribute('data-hide');

        const parent = item.parentElement?.closest('.dp-treeview-item') as HTMLLIElement;
        if (parent) {
            if (parent.dataset.expanded === 'false' || !parent.dataset.expanded) {
                parent.dataset.expanded = 'true';
            }
        }

        this._showParentItems(item);
    }

    /**
     * Показываем родительские элементы найденных элементов
     * @param item - элемент списка
     */
    private _showParentItems(item: HTMLLIElement) {
        if (item) {
            const parent = item.parentElement?.closest('.dp-treeview-item') as HTMLLIElement;
            parent.removeAttribute('data-hide');
            parent.dataset.expanded = 'true';
            if (parent?.dataset.level !== '1') {
                this._showParentItems(parent);
            }
        }
    }

    /**
     * Устанавливаем наблюдение за последним элементом найденного списка
     * @param folders - массив элементов первого уровня
     */
    private _setSearchObserver(folders: Array<any>) {
        if (this._searchObserver) {
            if (folders.length === this._max) {
                const folder = folders[folders.length - 1];
                this._searchObserver.observe(folder);
                this._renderObserver?.disconnect();
            }
        }
    }

    /**
     * Метод обработки ленивой загрузки
     * @param entries - записи
     * @param observer - наблюдатель
     */
    private _searchLazyLoading = (entries: any, observer: any) => {
        if (entries[0].isIntersecting) {
            observer.unobserve(entries[0].target);
            this.Search(this._searchText, 'name');
        }
    };

    /** Создание наблюдателя */
    private _createSearchObserver() {
        this._searchObserver = new IntersectionObserver(this._searchLazyLoading, {
            threshold: 1
        });
    }

    /**
     * Получаем родительскую модель
     * @param model - модель дочернего элемента
     */
    private _getParentModel(model: any) {
        let parentModel: any;

        const search = (model: any) => {
            const item = this._dataSource!.data.list.find((item: any) => {
                if (item[this._dataIdField] === model[this._dataParentIdField]) {
                    return item;
                }
            });
            if (item.nestingLevel === 1) {
                parentModel = item;
            } else {
                search(item);
            }
        };

        search(model);

        return parentModel;
    }

    // #region доступные методы

    /**
     * @public Передаем данные в компоненту
     * @param data - объект DPDataSource
     */
    public SetData(data: DPDataSource) {
        this._dataSource = data;
        if (this._dataSource?.data?.list) {
            this._checkSchemaModel();
            this._handleList(this._dataSource.data.list);
            this._createTree();
        } else if (this._dataSource?.data?.transport) {
            if (this._dataSource.data.transport.read) {
                this._dataSource.data.transport.read(() => {
                    this._checkSchemaModel();
                    this._handleList(this._dataSource!.data.list);
                    this._createTree();
                });
            }
        }
    }

    /**
     * @public Разворачивание элементов по id, uid или если значение не передано, всех элементов
     * @param value - значение параметра по которому происходит разворачивание
     * @param param - параметр, по которому происходит разворачивание
     */
    public Expand(value: string = 'all', param: string = 'id') {
        this._collapseAndExpand(value, param);
    }

    /**
     * @public Сворачивание элементов по id, uid или если значение не передано, всех элементов
     * @param value - значение параметра по которому происходит сворачивание
     * @param param - параметр, по которому происходит сворачивание
     */
    public Collapse(value: string = 'all', param: string = 'id') {
        this._collapseAndExpand(value, param, 'collapse');
    }

    /**
     * @public поиск кнопок по переданному полю(по умолчанию - текст кнопки)
     * @param query - поисковой запрос, которому должна соответствовать кнопка
     * @param param - параметр, по которому происходит поиск
     */
    public Search(query: string, param: string = 'name') {

        let folders: Array<HTMLLIElement> = [];
        let dataUid: string = '';

        for (let model of this._treeList) {
            const item = model.DataElement;
            if (item) {
                if (this._searchText !== query) {
                    if (item.dataset.created) this._resetDataItem(model);
                    this._removeAttrs(item);
                    if (query === '') {
                        if (item.dataset.hide) item.removeAttribute('data-hide');
                        if (model.expanded && item.dataset.expanded === 'false') {
                            item.dataset.expanded = 'true';
                        }
                    }
                    this._findChildren(model, query, 'remove');
                }
            }
            if (param === 'id' && query !== '') {
                if (!dataUid) {
                    dataUid = this._searchById(model, item, folders, query);
                }
            } else if (param === 'name') {
                if (folders.length < this._max) {
                    if (query !== '') {
                        this._searchByName(model, item, folders, query);
                    }
                }
            }
        }


        if (!folders.length && query !== '' && this._searchText !== query) {
            this._hideItems('');
            this._searchText = query;
            return;
        }

        this._searchText = query;

        if (query !== '' && folders.length) {
            setTimeout(() => {
                this._showItems(folders, query, dataUid);
                this._hideItems();
                this._setSearchObserver(folders);
            }, 0);
        } else if (!folders.length) {
            if (this._observableItem) {
                this._renderObserver?.observe(this._observableItem);
            }
        }

    }

    /**
     * @public поднять элемент выше
     * @param id - идентификатор элемента
     */
    public MoveUp(id?: string | undefined) {
        this._setMove(id, 'up');
    }

    /**
     * @public отпустить элемент ниже
     * @param id - идентификатор элемента
     */
    public MoveDown(id?: string) {
        this._setMove(id, 'down');
    }

    /**
     * Включает или отключает элементы меню
     * @param value - модель элемента, список моделей элементов или id элемента
     * @param disabled - false - включить, по умолчанию true - заблокировать
     */
    public Disable(value: any, disabled: boolean = true) {
        if (this._dataSource) {
            if (typeof value === 'string') {
                if (value === 'all') {
                    for (let model of this._treeList) {
                        model.disabled = disabled;
                        this._findChildren(model, '', 'disabled', disabled);
                    }
                } else {
                    const model = this._dataSource.GetById(value);
                    if (model) {
                        model.disabled = disabled;
                    }
                }
            } else if (value?.length && typeof value === 'object') {
                for (let model of value) {
                    model.disabled = value;
                }
            } else if (typeof value === 'object') {
                value.disabled = value;
            }
        }
    }

    // #endregion

    //  #region Кастомные события: loaded, dataload, dblselect, collapse, expand, select, dragstarted, dragended */
    private Events(type: string) {
        this.dispatchEvent(new Event(`${type}`));
    }

    /* #endregion */

    // #region set and get

    get dataSource(): DPDataSource | null {
        return this._dataSource ? this._dataSource : null;
    }

    set dataSource(data: DPDataSource | null) {
        this._setProperty('dataSource', data);
    }

    get dataChildrenField(): string {
        return this._dataChildrenField;
    }

    set dataChildrenField(value: string) {
        if (!this.isRender) {
            this._dataChildrenField = value;
        }
    }

    get dataTextField(): string {
        return this._dataTextField;
    }

    set dataTextField(value: string) {
        if (!this.isRender) {
            this._dataTextField = value;
        }
    }

    get dataDisabledField(): string {
        return this._dataDisabledField;
    }

    set dataDisabledField(value: string) {
        if (!this.isRender) {
            this._dataDisabledField = value;
        }
    }

    get dataIconField(): string {
        return this._dataIconField;
    }

    set dataIconField(value: string) {
        if (!this.isRender) {
            this._dataIconField = value;
        }
    }

    get secondIconField(): string {
        return this._secondIconField;
    }

    set secondIconField(value: string) {
        if (!this.isRender) {
            this._secondIconField = value;
        }
    }

    get dataParentIdField(): string {
        return this._dataParentIdField;
    }

    set dataParentIdField(value: string) {
        if (!this.isRender) {
            this._dataParentIdField = value;
        }
    }

    get dataIdField(): string {
        return this._dataIdField;
    }

    set dataIdField(value: string) {
        if (!this.isRender) {
            this._dataIdField = value;
        }
    }

    get generateIcon(): boolean {
        return this._generateIcon;
    }

    set generateIcon(value: boolean) {
        if (!this.isRender) {
            this._generateIcon = value;
        }
    }

    get move(): boolean {
        return this._move;
    }

    set move(value: boolean) {
        this._setProperty('move', value);
    }

    get state(): boolean {
        return this._state;
    }

    set state(value: boolean) {
        this._setProperty('state', `${value}`);
    }

    get selectedContext(): any {
        return this._selectedContext;
    }

    get select(): any {
        return this._select;
    }

    set select(value: any) {
        this._setProperty('select', value);
    }

    get edit(): boolean {
        return this._edit;
    }

    set edit(value: boolean) {
        this._setProperty('edit', value);
    }

    get dragdrop(): boolean {
        return this._dragdrop;
    }

    set dragdrop(value: boolean) {
        this._setProperty('dragdrop', value);
    }

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._setProperty('disabled', `${value}`);
    }

    get max(): number {
        return this._max;
    }

    set max(value: number) {
        this._max = value;
    }

    get noRecord(): string {
        return this._noRecord;
    }

    set noRecord(value: string) {
        if (!this.isRender) {
            this._noRecord = value;
        }
    }

    get collapsed(): any {
        return this._collapsed;
    }

    get expanded(): any {
        return this._expanded;
    }

    get position(): any {
        return this._position;
    }

    get dropPosition(): string | null {
        return this._dropPosition;
    }

    get destinationNode(): HTMLElement | null {
        return this._destinationNode;
    }

    get sourceNode(): HTMLLIElement | null {
        return this._sourceNode;
    }

    get moved(): Array<any> {
        return this._moved;
    }

    //  #endregion
});

customElements.define('dataplat-region', class DataplatRegion extends HTMLElement {
    public isRender: boolean;

    private _state: boolean;
    private _text: string;
    private _disabled: boolean;

    private _Component: HTMLElement | undefined;
    private _Content: HTMLElement | undefined;
    private _Button: HTMLButtonElement | undefined;

    constructor() {
        super();
        this.isRender = false;
        this._state = true;
        this._text = '';
        this._disabled = false;
    }

    connectedCallback() {
        if (!this.isRender) {
            this._Component = this as HTMLElement;
            this._Component.classList.add('dp-region');
            document.addEventListener('DOMContentLoaded', () => {
                this._initialize();
                this.Events('loaded');
                this.isRender = true;
            });
        }
    }

    static get observedAttributes() {
        return ['disabled', 'state', 'text'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this._setProperty(name, newValue, oldValue);
    }

    /**
     * Обработка входящих значение
     * @param name  - Имя свойства
     * @param newValue  - Новое значение
     * @param oldValue  - Старое значение (Не обязательный параметр);
     */
    private _setProperty(name: string, newValue: string | any, oldValue: string = '') {
        switch (name) {
            case 'disabled':
                if (typeof newValue === 'boolean') {
                    this._disable(newValue);
                } else {
                    if (newValue === 'true') this._disable(true);
                    if (newValue === 'false') this._disable(false);
                }
                break;
            case 'state':
                if (typeof newValue === 'boolean') {
                    this._toggle(newValue);
                } else {
                    if (newValue === 'true') this._toggle(true);
                    if (newValue === 'false') this._toggle(false);
                }
                break;
            case 'text':
                if (typeof newValue === 'string') {
                    this._setText(newValue);
                }
                break;
            default:
                break;
        }
    }

    /** Инициализация компоненты после загрузки DOM */
    private _initialize() {
        this._handlerParams();
        this._Content = this._Component?.lastElementChild as HTMLElement;
        this._Component?.prepend(this._createButton());
        this._handlerProperty();
    }

    /** Обработка параметров */
    private _handlerParams() {
        DPElements.Global.CheckProperty(this, 'text');
    }

    /** Обработка свойств */
    private _handlerProperty() {
        DPElements.Global.CheckProperty(this, 'state');
        DPElements.Global.CheckProperty(this, 'disabled');
    }

    /** Создание текстового содержимого */
    private _createText() {
        let text = document.createElement('p');
        text.classList.add('dp-region-text');
        text.innerText = this._text;

        return text;
    }

    /** Создание кнопки */
    private _createButton() {
        this._Button = document.createElement('button');
        this._Button.classList.add('dp-region-button');
        this._Button.addEventListener('click', () => this._toggle());
        this._Button.append(this._createArrow(), this._createText());
        this._Button!.dataset.expanded = `${this._state}`;
        if (this._Content && !this._state) this._Content!.classList.add('dp-region-hide');
        return this._Button;
    }

    /** Создание стрелки */
    private _createArrow() {
        let buttonArrow = document.createElement('span');
        buttonArrow.classList.add('dp-region-button-arrow');

        let arrow = document.createElement('span');
        arrow.classList.add('dp-region-arrow');

        buttonArrow.append(arrow);

        return buttonArrow;
    }

    /** Скрываем элемент после конца анимации */
    private _setDisplayNone = () => {
        this._Content!.classList.add('dp-region-hide');
    };

    /**
     * Закрыть или открыть регион
     * @param value - true - открыть, false - закрыть
     */
    private _toggle(value?: boolean) {
        if (value !== this._state) {
            this._state ? (this._state = false) : (this._state = true);
            if (this._Content && this._Button) {
                this._Button!.dataset.expanded = `${this._state}`;
                if (!this._state) {
                    this._Content!.style.animation = 'region-close 0.3s ease';
                    this._Content.addEventListener('animationend', this._setDisplayNone);
                } else {
                    this._Content!.style.animation = 'region-open 0.3s ease';
                    this._Content!.classList.remove('dp-region-hide');
                    this._Content.removeEventListener('animationend', this._setDisplayNone);
                }
                this.Events('state');
            }
        }
    }

    /**
     * Устанавливаем текстовое содержимое
     * @param value - текстовое значение
     */
    private _setText(value: string) {
        if (value !== this._text) {
            this._text = value;
            const text = this._Button?.querySelector('.dp-region-text') as HTMLSpanElement;
            if (text) {
                text.innerText = value;
            }
        }
    }

    /**
     * Включает или отключает элементы меню
     * @param value - модель элемента, список моделей элементов или id элемента
     */
    private _disable(value: boolean) {
        this._disabled = value;
        if (this._Button) {
            if (value) this._Button.disabled = true;
            if (!value) this._Button.disabled = false;
        }
    }

    //  #region Кастомные события: state */
    private Events(type: string) {
        this.dispatchEvent(new Event(`${type}`));
    }

    /* #endregion */

    // #region set and get

    set disabled(value: boolean) {
        this._setProperty('disabled', `${value}`);
    }

    set state(value: boolean) {
        this._setProperty('state', `${value}`);
    }

    set text(value: string) {
        this._setProperty('text', value);
    }

    get state(): boolean {
        return this._state;
    }

    get text(): string {
        return this._text;
    }

    get disabled(): boolean {
        return this._disabled;
    }

    //  #endregion
});

interface TabProperties {
    action: string,
    active: boolean,
    disabled: boolean,
}


