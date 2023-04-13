/// <reference path="./dataplat.elements.ts" />

/** Включатель */
interface DPElementSwitch extends HTMLElement {
    /**Текст отображаемый справа */
    get text(): string;
    /**Текст отображаемый справа */
    set text(value: string);
    /**Второй текст отображаемый справа */
    get second(): string;
    /**Второй текст отображаемый справа */
    set second(value: string);
    /**Значение true/false */
    get value(): boolean;
    /**Значение true/false */
    set value(value: boolean);
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    get disabled(): boolean;
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    set disabled(value: boolean);
    /** Подсказка элемента */
    get title(): string;
    /** Подсказка элемента */
    set title(value: string);
}
/** Радио кнопка */
interface DPElementRadio extends HTMLElement {
    /**Текст отображаемы справа */
    get text(): string;
    /**Текст отображаемы справа */
    set text(value: string);
    /**Имя значения */
    get name(): string;
    /**Имя значения */
    set name(value: string);
    /**Значение */
    get value(): string;
    /**Значение */
    set value(value: string);
    /**Состояние true/false */
    get checked(): boolean;
    /**Состояние true/false */
    set checked(value: boolean);
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    get disabled(): boolean;
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    set disabled(value: boolean);
    /** Подсказка элемента */
    get title(): string;
    /** Подсказка элемента */
    set title(value: string);
}
/** Включатель */
interface DPElementCheckBox extends HTMLElement {
    /**Текст отображаемый справа */
    get text(): string;
    /**Текст отображаемый справа */
    set text(value: string);
    /**Значение true/false */
    get value(): boolean;
    /**Значение true/false */
    set value(value: boolean);
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    get disabled(): boolean;
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    set disabled(value: boolean);
    /** Подсказка элемента */
    get title(): string;
    /** Подсказка элемента */
    set title(value: string);

}
/** Поле поиска */
interface DPElementSearch extends HTMLElement {
    /** Включение кнопок сортировки, true - включить, false - выключить */
    get sorting(): string;
    /** Включение кнопок сортировки, true - включить, false - выключить */
    set sorting(value: string);
    /**Значение true/false */
    get value(): string;
    /**Значение в поле */
    set value(value: string);
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    get disabled(): boolean;
    /**Заблокировать элемент. true - заблокировать, false - снять блокировку */
    set disabled(value: boolean);
    /** Включение кнопок свернуть или развернуть, только для чтения */
    get tree(): string;
    /** Включение кнопок свернуть или развернуть, только для чтения */
    set tree(value: string);
}

interface DPElementNumber extends HTMLElement {
    /**
     * Получить числовое значение компонента. По умолчанию - undefined. При получении приходит число, undefined или null.
     */
    get value(): number;
    /**
     * Получить числовое значение компонента. По умолчанию - undefined. При записи можно передать строку, число, undefined или null.
     */
    set value(value: number | string);
    /**
     * Получить минимальное числовое значение компонента. По умолчанию - -Infinity.
     */
    get min(): number;
    /**
     * записать минимальное числовое значение компонента. По умолчанию - -Infinity.
     */
    set min(value: number);
    /**
     * Получить максимальное числовое значение компонента. По умолчанию - Infinity.
     */
    get max(): number;
    /**
     * записать максимальное числовое значение компонента. По умолчанию - Infinity.
     */
    set max(value: number);
    /**
     * Получить шаг, на который изменяется числовое значение компонента. По умолчанию - 1.
     */
    get step(): number;
    /**
     * записать шаг, на который изменяется числовое значение компонента. По умолчанию - 1.
     */
    set step(value: number);
    /**
     * Получить количество знаков после запятой числового значения компонента. По умолчанию - 3.
     */
    get restrictDecimals(): number;
    /**
     * записать количество знаков после запятой числового значения компонента. По умолчанию - 3.
     */
    set restrictDecimals(value: number);
    /**
     * Получить число, на которое умножается числовое значения компонента перед отображением. По умолчанию - 1.
     */
    get factor(): number;
    /**
     * записать число, на которое умножается числовое значения компонента перед отображением. По умолчанию - 1.
     */
    set factor(value: number);
    /**
     * Получить формат отображения компонента.
     * По умолчанию “number” – рядом со значением не отображается ничего,
     * “percent” – справа от значения отображается значок “%” ,
     * “currency” – слева от значения отображается значок “₽”.
     */
    get format(): string;
    /**
     * записать формат отображения компонента.
     * По умолчанию “number” – рядом со значением не отображается ничего,
     * “percent” – справа от значения отображается значок “%” ,
     * “currency” – слева от значения отображается значок “₽”.
     */
    set format(value: string);
    /**
     *  Получить текст, отображаемый при наведении на компонент.
     */
    get text(): string;
    /**
     *  записать текст, отображаемый при наведении на компонент.
     */
    set text(value: string);
    /**
     * Получить текст внутри текстового поля, который исчезает при получении фокуса.
     */
    get placeholder(): string;
    /**
     * записать текст внутри текстового поля, который исчезает при получении фокуса.
     */
    set placeholder(value: string);
    /**
     * Получить текст, отображаемый при наведении на стрелку вверх.
     */
    get upArrowText(): string;
    /**
     * записать текст, отображаемый при наведении на стрелку вверх.
     */
    set upArrowText(value: string);
    /**
     * Получить текст, отображаемый при наведении на стрелку вниз.
     */
    get downArrowText(): string;
    /**
     * записать текст, отображаемый при наведении на стрелку вниз.
     */
    set downArrowText(value: string);
    /**
     * Получить значение, округляется ли значение компонента.
     */
    get round(): boolean;
    /**
     * записать значение, округляется ли значение компонента.
     */
    set round(value: boolean);
    /**
     * Получить значение, выделяется ли значение компонента при фокусе.
     * true/false если “true”, то при фокусе на компоненте текст выделяется.
     * По умолчанию -  “false”.
     */
    get selectOnFocus(): boolean;
    /**
     * записать значение, выделяется ли значение компонента при фокусе.
     * true/false если “true”, то при фокусе на компоненте текст выделяется.
     * По умолчанию -  “false”.
     */
    set selectOnFocus(value: boolean);
    /**
     * Получить значение, отображаются ли стрелки увеличения/уменьшения значения компонента.
     * true - отображаются, false - не отображаются.
     * По умолчанию -  “true”.
     */
    get showArrows(): boolean;
    /**
     * записать значение, отображаются ли стрелки увеличения/уменьшения значения компонента.
     * true - отображаются, false - не отображаются.
     * По умолчанию -  “true”.
     */
    set showArrows(value: boolean);
    /**
     * Получить значение, можно ли редактировать значение компонента стрелками или вводом.
     * true - нельзя, false - можно.
     * По умолчанию -  “false”.
     */
    get readonly(): boolean;
    /**
     * записать значение, можно ли редактировать значение компонента стрелками или вводом.
     * true - нельзя, false - можно.
     * По умолчанию -  “false”.
     */
    set readonly(value: boolean);
    /**
     * Получить значение активности компонента.
     * true - не активный, false - активный.
     * По умолчанию -  “false”.
     */
    get disabled(): boolean;
    /**
     * записать значение активности компонента.
     * true - не активный, false - активный.
     * По умолчанию -  “false”.
     */
    set disabled(value: boolean);
}

interface IDPDataSource {
    list?: any; //Список
    transport?: {
        read?: Function;
        add?: Function;
        edit?: Function;
        remove?: Function;
    },
    schema?: {
        model?: any;
    };
}

interface DPElementTab extends HTMLElement {
    /** Передать/получить объект класса (содержащий исходные данные) для отображения списка */
    dataSource: DPDataSource;
    /** HTML элемент вкладки */
    el?: HTMLElement;
    /** Вызывается при выборе вкладки */
    onSelect?: Function;
    /** Вызывается когда контент вкладок развернулся или свернулся */
    onState?: Function;
    /** Вызывается при изменении размера окна */
    onResize?: Function;
    /** Вызывается при изменении состояния активных или не активных вкладок */
    onDisabled?: Function;
    /** Вызывается при создании новой вкладки */
    onCreate?: Function;
    /** Вызывается при открытии или закрытие модального окна */
    onModal?: Function;
    /** Вызывается при удалении вкладки */
    onRemove?: Function;
    /** Установить/получить action вкладки, которую нужно открыть */
    tab: string;
    /** Установить/получить состояние контента вкладок, true - открытое, false - закрытое. По умолчанию true */
    state: boolean;
    /** Позиция вкладки, top, left, right, bottom - по умолчанию top */
    position: string;
    /** Блокировать/разблокировать все элементы, true - заблокировать, возвращает состояние блокировки, по умолчанию - false */
    disabled: boolean;
    /** Главное вкладка, будет включаться при сбросе */
    main: string;
    /** Состояние вкладок если есть main. true - активная вкладка только main, false - все вкладки активные */
    mainOnly: boolean;
    /** Имя вкладки по умолчанию, которая задается ей при создании */
    defaultName: string;
    /** Разрешает вызов модального окна, по умолчанию - false */
    modal: boolean;
    /** Установить/получить имя ключа объекта модели, в котором хранится action модели, по умолчанию 'action' */
    dataActionField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится текст, по умолчанию 'name' */
    dataTextField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится идентификатор, по умолчанию 'id' */
    dataIdField: string;
    /** Установить активную вкладку, принимает TabProperties || action, получить модель активной вкладки, по умолчанию null */
    select: any;
    /** Получить свойства вкладок */
    tabProperties: Array<TabProperties>;
    /**
     * Определяем содержимое вкладки
     * icon - отображаются только иконки
     * name - отображается только название
     * full - отображается название и иконка
     */
    buttonType: string;
    /** Установить/получить надпись, которая добавляется при отсутствии контента, по умолчанию - "Необходимо выбрать вкладку" */
    noLayout: string;

    /**
     * Добавить новый элемент
     * @param model - модель созданного элемента
     * @param el - содержимое контентной части, string | HTMLElement | template
     */
    Add(model: any, el: string | HTMLElement): Function;

    /**
     * Получить контейнер контента вкладки
     * @param id - идентификатор элемента
     */
    GetContent(id: string): HTMLElement;

    /**
     * Включаем или отключаем вкладку
     * @param tab - название вкладки
     * @param result - true - включить вкладку, false - выключить вкладку
     */
    DisabledTab(tab: string, result: boolean): Function;

    /**
     * Подписка события
     * @param type - Тип обработки события
     * @param listener - Объект, который принимает уведомление, когда событие указанного типа произошло.
     * @param options - Объект, который определяет характеристики объекта, прослушивающего событие.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): Function;
}

interface DPElementMenu extends HTMLElement {
    /** Установить/получить состояние меню, false - закрыть, по умолчанию - true */
    state: boolean;
    /** Установить/получить имя первой вкладки, по умолчанию - 'Не выбран' */
    firstName: string;
    /** Установить/получить имя второй вкладки, по умолчанию - 'Не выбран'  */
    secondName: string;
    /** Создаем или убираем вторую вкладку, по умолчанию - false */
    twoNames: boolean;

    /**
     * Подписка события
     * @param type - Тип обработки события
     * @param listener - Объект, который принимает уведомление, когда событие указанного типа произошло.
     * @param options - Объект, который определяет характеристики объекта, прослушивающего событие.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): Function;

}

interface DPElementAccordionList extends HTMLElement {
    /**
     * получить объект класса DPDataSource, для работы с дочерними кнопками. В случае записи происходит перерендер компонента
     */
    get dataSource(): DPDataSource | null;
    /**
     * записать объект класса DPDataSource, для работы с дочерними кнопками. В случае записи происходит перерендер компонента
     */
    set dataSource(value: DPDataSource | null);
    /**
     * получить состояние режима отображения аккордеона.
     * при значении “icons” – отображаются только иконки,
     * при значении “text” – отображается только текст, при любом другом значении отображаются и иконка, и текст дочерних кнопок.
     * по умолчанию отображаются и текст и иконки
     */
    get mode(): string;
    /**
     * записать состояние режима отображения аккордеона.
     * при значении “icons” – отображаются только иконки,
     * при значении “text” – отображается только текст, при любом другом значении отображаются и иконка, и текст дочерних кнопок.
     * по умолчанию отображаются и текст и иконки
     */
    set mode(value: string);
    /**
     * получить значение ключа объекта модели, в котором хранится текст кнопки.
     * По умолчанию - name.
     */
    get dataTextField(): string;
    /**
     * записать значение ключа объекта модели, в котором хранится текст кнопки.
     * Записать можно только до первоначального рендера компонента.
     * По умолчанию - name.
     */
    set dataTextField(value: string);
    /**
     * получить значение ключа объекта модели, в котором хранится id кнопки.
     * По умолчанию - id.
     */
    get dataValueField(): string;
    /**
     * записать значение ключа объекта модели, в котором хранится id кнопки.
     * Записать можно только до первоначального рендера компонента.
     * По умолчанию - id.
     */
    set dataValueField(value: string);
    /**
     * получить значение ключа объекта модели, в котором хранится иконка кнопки.
     * По умолчанию - icon.
     */
    get dataIconField(): string;
    /**
     * записать значение ключа объекта модели, в котором хранится иконка кнопки.
     * Записать можно только до первоначального рендера компонента.
     * По умолчанию - icon.
     */
    set dataIconField(value: string);
    /**
     * получить значение ключа объекта модели, в котором хранится статус, является ли кнопка групповой.
     * По умолчанию - isGroup.
     */
    get dataIsGroupField(): string;
    /**
     * записать значение ключа объекта модели, в котором хранится статус, является ли кнопка групповой.
     * Записать можно только до первоначального рендера компонента.
     * По умолчанию - isGroup.
     */
    set dataIsGroupField(value: string);
    /**
     * получить значение ключа объекта модели, в котором хранится parentId кнопки.
     * По умолчанию - parentId.
     */
    get dataParentIdField(): string;
    /**
     * записать значение ключа объекта модели, в котором хранится parentId кнопки.
     * Записать можно только до первоначального рендера компонента.
     * По умолчанию - parentId.
     */
    set dataParentIdField(value: string);
    /**
     * получить модель, выбранной кнопки.
     * При получении всегда приходит модель-объект
     */
    get selected(): any;
    /**
     * записать модель, выбранной кнопки.
     * При записи можно передать id модели или саму модель-объект.
     */
    set selected(value: any | string);
    /**
     * получить id кнопки, которую нужно выбрать сразу после рендера.
     */
    get selectedId(): string;
    /**
     * записать id кнопки, которую нужно выбрать сразу после рендера.
     */
    set selectedId(value: string);
    /**
     * получить объект типа {up: boolean, down: boolean}. если true - выбранный элемент можно сдвинуть выше/ниже.
     */
    get position(): { up: boolean; down: boolean; };
    /**
     * получить значение id атрибута нажатой кнопки
     */
    /**
     * изменение родителя элемента
     * @param id - id кнопки
     * @param parentId - parentId кнопки
     */
    SetNewParent(id: string, parentId: string): Function;
    /**
     * поиск кнопок по переданному полю(по умолчанию - текст кнопки)
     * @param query - поисковой запрос, которому должна соответствовать кнопка
     * @param field - поле, по которому происходит поиск. По умолчанию dataTextField.
     */
    FindItems(query: string, field: string): Function;
    /**
     * @param id - id модели кнопки, которую нужно задизейблить/включить
     * @param status - true - для дизейбла, false для включения
     * дизейбл/включение кнопки аккордеона
     */
    Disable(id: string, status: boolean): Function;
    /**
     * закрытие всех вложенных списков
     */
    CollapseAll(): Function;
    /**
     * открытие всех вложенных списков
     */
    ExpandAll(): Function;
    /**
     * очистка выделения кнопок
     */
    ClearSelect(): Function;
    /**
     * сдвинуть элемент выше
     * @param id - id модели элемента
     *
     */
    MoveUp(id: string): Function;
    /**
     * сдвинуть элемент ниже
     * @param id - id модели элемента
     */
    MoveDown(id: string): Function;
}

interface DPElementRadioButton extends HTMLElement {
    /**
     * получить текст, отображаемый при наведении на компонент
     */
    get title(): string;
    /**
     * записать текст, отображаемый при наведении на компонент
     */
    set title(value: string);
    /**
     * Получить значение блокировки компонента(true - заблокированы, false - активный). По умолчанию - false.
     */
    get disabled(): boolean;
    /**
     * записать значение блокировки компонента(true - заблокированы, false - активный). По умолчанию - false.
     */
    set disabled(value: boolean);
    /**
     * получить значение атрибута 'name' внутреннего input type 'radio' элемента.
     */
    get name(): string;
    /**
     * записать значение атрибута 'name' внутреннего input type 'radio' элемента.
     */
    set name(value: string);
    /**
     * получить id иконки компонента из спрайта.
     */
    get icon(): string;
    /**
     * записать id иконки компонента из спрайта.
     */
    set icon(value: string);
    /**
     * получить значение 'checked' внутреннего input type 'radio' элемента. По умолчанию - false.
     */
    get value(): boolean;
    /**
     * записать значение 'checked' внутреннего input type 'radio' элемента. По умолчанию - false.
     */
    set value(value: boolean);
    /**
     * получить значение действия, которое должно выполниться, при нажатии на компонент.
     */
    get action(): string;
    /**
     * записать значение действия, которое должно выполниться, при нажатии на компонент.
     */
    set action(value: string);
}

interface DPElementCheckboxButton extends HTMLElement {
    /**
     * получить текст, отображаемый при наведении на компонент
     */
    get title(): string;
    /**
     * записать текст, отображаемый при наведении на компонент
     */
    set title(value: string);
    /**
     * Получить значение блокировки компонента(true - заблокированы, false - активный). По умолчанию - false.
     */
    get disabled(): boolean;
    /**
     * записать значение блокировки компонента(true - заблокированы, false - активный). По умолчанию - false.
     */
    set disabled(value: boolean);
    /**
     * получить значение атрибута 'name' внутреннего input type 'checkbox' элемента.
     */
    get name(): string;
    /**
     * записать значение атрибута 'name' внутреннего input type 'checkbox' элемента.
     */
    set name(value: string);
    /**
     * получить id иконки компонента из спрайта.
     */
    get icon(): string;
    /**
     * записать id иконки компонента из спрайта.
     */
    set icon(value: string);
    /**
     * получить id подменной иконки компонента из спрайта.
     */
    get iconReplace(): string;
    /**
     * записать id подменной иконки компонента из спрайта.
     */
    set iconReplace(value: string);
    /**
     * получить значение 'checked' внутреннего input type 'checkbox' элемента. По умолчанию - false.
     */
    get value(): boolean;
    /**
     * записать значение 'checked' внутреннего input type 'checkbox' элемента. По умолчанию - false.
     */
    set value(value: boolean);
    /**
     * получить значение действия, которое должно выполниться, при нажатии на компонент.
     */
    get action(): string;
    /**
     * записать значение действия, которое должно выполниться, при нажатии на компонент.
     */
    set action(value: string);
}

interface DPElementToolbar extends HTMLElement {
    /**
     * Получить значение блокировки дочерних элементов компонента(true - заблокированы, false - активный). По умолчанию - false.
     */
    get disabled(): boolean;
    /**
     * записать значение блокировки дочерних элементов компонента(true - заблокированы, false - активный). По умолчанию - false.
     */

    set disabled(value: boolean);
    /**
     * получить значение id атрибута нажатой кнопки
     */
    get selectedId(): string;
    /**
     * получить значение data-action/action атрибута нажатой кнопки
     */
    get selectedAction(): string;
    /**
     * получить массив, по которому были динамически созданы дочерние элементы тулбара
     */
    get items(): Array<any> | undefined;
    /**
     * динамически создаем дочерние элементы тулбара по переданному массиву
     * @param value - массив объектов с информацией о кнопках
     */
    set items(value: Array<any> | undefined);
    /**
     * блокировка/включение элемента тулбара
     * @param action - значение геттера action/data-action атрибута элемента, которую нужно заблокировать/включить
     * @param status - true - для блокировки, false для включения
     */
    Disable(action: string, status: boolean): Function;
    /**
     * добавление элемента в тулбар
     * @param value - объект с информацией о кнопке
     */
    Add(value: any): Function;
    /**
     * @public удаление дочернего элемента компонента
     * @param action - значение геттера action/data-action атрибута элемента, который нужно удалить
     */
    Remove(action: any): Function;
}

interface DPElementDropdownButton extends HTMLElement {
    /**
     * Получить значение блокировки дочерних элементов компонента(true - заблокированы, false - активный). По умолчанию - false.
     */
    get disabled(): boolean;
    /**
     * записать значение блокировки дочерних элементов компонента(true - заблокированы, false - активный). По умолчанию - false.
     */
    set disabled(value: boolean);
    /**
     * получить значение id атрибута нажатой кнопки
     */
    get selectedId(): string;
    /**
     * получить значение data-action атрибута нажатой кнопки
     */
    get selectedAction(): string;
    /**
     * блокировка/включение кнопки дропдаун кнопки
     * @param action - значение атрибута action кнопки, которую нужно заблокировать/включить
     * @param status - true - для блокировки, false для включения
     */
    Disable(action: string, status: boolean): Function;
}

interface DPElementDatePicker extends HTMLElement {
    /** Устанавливает/возвращает значение календарю, по умолчанию new Date() */
    value: Date | string;
    /** Включает/отключает время, возвращает булевое значение, по умолчанию - true */
    time: boolean;
    /** Устанавливает/возвращает состояние блокировки календаря, true - заблокировать, false - разблокировать, по умолчанию false */
    disabled: boolean;
    /** Устанавливает/возвращает максимально допустимую дату для выбора, по умолчанию - new Date(2099, 11, 31) */
    max: Date;
    /** Устанавливает/возвращает минимально допустимую дату для выбора, по умолчанию - new Date(1900, 0, 1) */
    min: Date;
    /** Устанавливает/возвращает формат даты, по умолчанию - "DD.MM.YYYY HH:mm" */
    dateFormat: string;
    /** Устанавливает/возвращает формат времени во вкладке выбора времени, по умолчанию - "HH:mm" */
    timeFormat: string;
    /** Запрещает редактирование поля, возвращает булевое значение, по умолчанию - false */
    readonly: boolean;

    /** Устанавливает максимально допустимое время до текущего, по умолчанию - '', возвращает выбранное время
     * Если установлен max - то maxTime автоматически подключится, false - отключить.
     */
    maxTime: boolean | string;
    /** Включает/отключает анимацию календаря, по умолчанию - true */
    animation: boolean;
    /** Возвращает булевое значение, true - открыто, false - закрыто, по умолчанию - false */
    isOpen: boolean;
    /** Возвращает булевое значение, true - открыто окно со временем, false - закрыто, по умолчанию - false */
    isOpenTime: boolean;

    /**
     * Подписка события
     * @param type - Тип обработки события
     * @param listener - Объект, который принимает уведомление, когда событие указанного типа произошло.
     * @param options - Объект, который определяет характеристики объекта, прослушивающего событие.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): Function;
}

interface DPElementSelect extends HTMLElement {
    /** Передать/получить объект класса (содержащий исходные данные) для отображения списка */
    dataSource: DPDataSource;
    /** Получить/записать значение
     * @param {string} - если работаем с обычным списком
     * @param {Array<any>} - если работаем с мульти списком
     */
    value: string | Array<any>;
    /** Получить/записать индекс элемент, который необходимо выбрать */
    select: number;
    /** Получить/записать текст выбранного элемента */
    text: string;
    /** Заблокировать элемент. true - заблокировать, false - снять блокировку */
    disabled: boolean;
    /** Разрешить/запретить редактирование поля ввода */
    readonly: boolean;
    /** Получить/записать наименование ключа объекта модели, в котором хранится значение. */
    dataValueField: string;
    /** Получить/записать наименование ключа объекта модели, в котором хранится текст. */
    dataTextField: string;
    /** Включить режим мульти выбора, по умолчанию - false */
    multi: boolean;
    /** Перевести список в древовидный вид, по умолчанию - false */
    tree: boolean;
    /** Перевести список в сгрупированный вид, по умолчанию - false */
    group: boolean;
    /** Включить кнопку очистки поля ввода, по умолчанию - false */
    clearButton: boolean;
    /** Возвращает id родительского элемента */
    parent: string | number;
    /** Получить модель выбранного элемента */
    selected: any;
    /** Возвращает булевое значение, true - открыто, false - закрыто, по умолчанию - false */
    isOpen: boolean;

    /** Метод для открытия выпадающего списка */
    Open(): Function;

    /** Метод для закрытия выпадающего списка */
    Close(): Function;

    /**
     * Подписка события
     * @param type - Тип обработки события
     * @param listener - Объект, который принимает уведомление, когда событие указанного типа произошло.
     * @param options - Объект, который определяет характеристики объекта, прослушивающего событие.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): Function;
}

interface DPElementLoad extends HTMLElement {
    /**
     * Получить текст индикатора загрузки.
     */
    get text(): string;
    /**
     * записать текст индикатора загрузки.
     */
    set text(value: string);
    /**
     * Получить активность индикатора загрузки(true - активный, false - неактивный). По умолчанию - false.
     */
    get active(): boolean;
    /**
     * записать активность индикатора загрузки(true - активный, false - неактивный). По умолчанию - false.
     */
    set active(value: boolean);
    /**
     * Получить размер индикатора загрузки("large"/"regular"/"small"). По умолчанию - "regular".
     */
    get size(): "large" | "regular" | "small";
    /**
     * записать размер индикатора загрузки("large"/"regular"/"small"). По умолчанию - "regular".
     */
    set size(value: "large" | "regular" | "small");
}

interface DPElementProgress extends HTMLElement {
    /**
     * получить значение компонента. По умолчанию - 0.
     */
    get value(): number;
    /**
     * записать значение компонента. По умолчанию - 0.
     */
    set value(value: number);
    /**
     * получить минимальное значение компонента. По умолчанию - 0.
     */
    get min(): number;
    /**
     * записать минимальное значение компонента. По умолчанию - 0.
     */
    set min(value: number);
    /**
     * получить максимальное значение компонента. По умолчанию - 100.
     */
    get max(): number;
    /**
     * записать максимальное значение компонента. По умолчанию - 100.
     */
    set max(value: number);
    /**
     * получить значение блокировки компонента.
     * true/false, true - заблокирован, false - активен.
     * По умолчанию - false.
     */
    get disabled(): boolean;
    /**
     * записать значение блокировки компонента.
     * true/false, true - заблокирован, false - активен.
     * По умолчанию - false.
     */
    set disabled(value: boolean);
    /**
     * получить статус наличия анимации компонента.
     * true/false, true - анимирован, false - не анимирован.
     * По умолчанию - true.
     */
    get animation(): boolean;
    /**
     * записать статус наличия анимации компонента.
     * true/false, true - анимирован, false - не анимирован.
     * По умолчанию - true.
     */
    set animation(value: boolean);
}

interface DPElementRange extends HTMLElement {
    /**
     * получить числовое значение слайдеров.
     * при получении приходит массив чисел [valueFirst, valueSecond].
     */
    get value(): Array<number | null>;
    /**
     * записать числовое значение слайдеров.
     * при записи можно передать:
     * число, строку, которую можно перевести в число - значение запишется в valueFirst(первый слайдер).
     * массив чисел(на месте одного из чисел можно передать null)
     * - значения запишутся соответственно value[0] в valueFirst, value[1] в valueSecond.
     * при передаче массива чисел value[0] должно быть меньше value[1] минимум на 1.
     */
    set value(value: number | string | Array<number | null>);
    /**
     * получить минимальное числовое значение слайдеров.
     * по умолчанию - 0.
     */
    get min(): number;
    /**
     * записать минимальное числовое значение слайдеров.
     * по умолчанию - 0.
     */
    set min(value: number);
    /**
     * получить максимальное числовое значение слайдеров.
     * по умолчанию - 100.
     */
    get max(): number;
    /**
     * записать максимальное числовое значение слайдеров.
     * по умолчанию - 100.
     */
    set max(value: number);
    /**
     * получить значение блокировки компонента - true/false.
     * true - заблокированный, false - активный.
     * по умолчанию - false.
     */
    get disabled(): boolean;
    /**
     * записать значение блокировки компонента - true/false.
     * true - заблокированный, false - активный.
     * по умолчанию - false.
     */
    set disabled(value: boolean);
    /**
     * получить количество слайдеров компонента - true/false.
     * true - 2, false - 1.
     * по умолчанию - false.
     */
    get double(): boolean;
    /**
     * записать количество слайдеров компонента - true/false.
     * true - 2, false - 1.
     * по умолчанию - false.
     */
    set double(value: boolean);
    /**
     * получить количество интервалов компонента.
     * по умолчанию - 4.
     */
    get intervals(): number;
    /**
     * записать количество интервалов компонента.
     * по умолчанию - 4.
     */
    set intervals(value: number);
    /**
     * получить режим отображения меток компонента - "arrow"/"scale".
     * "arrow" - стрелки.
     * "scale" - шкала.
     * по умолчанию - "arrow".
     */
    get stepMode(): string;
    /**
     * записать режим отображения меток компонента - "arrow"/"scale".
     * "arrow" - стрелки.
     * "scale" - шкала.
     * по умолчанию - "arrow".
     */
    set stepMode(value: string);
    /**
     * получить режим отображения компонента - true/false.
     * true - вертикальный, false - горизонтальный.
     * по умолчанию - false.
     */
    get vertical(): boolean;
    /**
     * записать режим отображения компонента - true/false.
     * true - вертикальный, false - горизонтальный.
     * по умолчанию - false.
     */
    set vertical(value: boolean);
    /**
     * получить статус отображения меток и интервалов компонента - true/false.
     * true - отображаются, false - не отображаются.
     * по умолчанию - true.
     */
    get marks(): boolean;
    /**
     * записать статус отображения меток и интервалов компонента - true/false.
     * true - отображаются, false - не отображаются.
     * по умолчанию - true.
     */
    set marks(value: boolean);
    /**
     * получить статус отображения чисел возле меток компонента - true/false.
     * true - отображаются, false - не отображаются.
     * по умолчанию - true.
     */
    get numbers(): boolean;
    /**
     * записать статус отображения чисел возле меток компонента - true/false.
     * true - отображаются, false - не отображаются.
     * по умолчанию - true.
     */
    set numbers(value: boolean);
}

interface DPElementActionButton extends HTMLElement {
    /**
     * получить значение id иконки в спрайте.
     */
    get icon(): string;
    /**
     * получить значение id подменной иконки в спрайте.
     * иконка появляется при клике на кнопку.
     */
    get iconReplace(): string;
    /**
     * получить значение режима кнопки - true/false.
     * true - кнопка для добавления, id иконки в спрайте - add.
     * false - кнопка для чего-то другого.
     * по умолчанию - false.
     */
    get add(): boolean;
    /**
     * Получить значение блокировки компонента/главной кнопки(true - заблокированы, false - активный). По умолчанию - false.
     */
    get disabled(): boolean;
    /**
     * записать значение блокировки компонента/главной кнопки(true - заблокированы, false - активный). По умолчанию - false.
     */
    set disabled(value: boolean);
    /**
     * получить значение действия, которое должно выполниться, при нажатии на компонент/главной кнопке.
     */
    get action(): string;
    /**
     * записать значение действия, которое должно выполниться, при нажатии на компонент/главной кнопке.
     */
    set action(value: string);
    /**
     * получить значение id атрибута нажатой кнопки
     */
    get selectedId(): string;
    /**
     * получить значение data-action(action в случае главной кнопки) атрибута нажатой кнопки
     */
    get selectedAction(): string;
    /**
     * блокировка/включение дочерней кнопки компонента
     * @param action - значение атрибута data-action кнопки, которую нужно заблокировать/включить
     * @param status - true - для блокировки, false для включения
     */
    Disable(action: string, status: boolean): Function;
}

interface DPElementContext extends HTMLElement {
    /** Передать/получить объект класса (содержащий исходные данные) для отображения списка */
    dataSource: DPDataSource;
    /** Установить/получить цель, при клике на которую будет открываться контекстное меню, необходимо передавать идентификатор цели */
    target: string | boolean;
    /** Указывает событие, при котором будет открываться меню (PointerEvent, MouseEvent), по умолчанию 'contextmenu' */
    event: string;
    /** Блокирует все элементы в списке, true - заблокировать, false - разблокировать, по умолчанию false */
    disabled: boolean;
    /** Установить/получить имя ключа объекта модели, в котором хранится текст, по умолчанию 'name' */
    dataTextField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится action модели, по умолчанию 'action' */
    dataActionField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится идентификатор модели, по умолчанию 'id' */
    dataIdField: string;
    /** Определяет название поля disabled в модели данных, по умолчанию 'disabled' */
    dataDisabledField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится название иконки или url, по умолчанию 'icon' */
    dataIconField: string;
    /** Установить направление, в котором будет открываться контекстное меню ["top", "bottom", "left", "right"], по умолчанию 'right' */
    direction: string;
    /** Установить направление, в котором будет открываться подменю ["top", "bottom", "left", "right"],  по умолчанию 'right' */
    subDirection: string;
    /** Установить привязку по цели (target), список будет открываться относительно цели, по умолчанию false */
    alignToAnchor: boolean;
    /** Установить задержку в мс перед открытием/закрытием подменю, по умолчанию 100 */
    hoverDelay: number;
    /** Получить action выбранного пункта меню */
    action: string;
    /** Получить булевое значение, false - меню закрыто, true - меню открыто */
    isOpen: boolean;
    /** Установить наименование класса, при клике на который меню не будет закрываться */
    ignoreClass: string;
    /** Установить/получить модель выбранного элемента, по умолчанию - null */
    select: any;
    /** Включить подсветку выбранного элемента, по умолчанию - false */
    active: any;

    /**
     * Устанавливает исходные данные для отображения списка
     * @param data - объект класса DPDataSource
     */
    SetData(data: DPDataSource): Function;

    /**
     * Метод для открытия меню, с заданными ему координатами
     * @param x - координата по оси X
     * @param y - координата по оси Y
     */
    Open(x: number, y: number): Function;

    /** Метод для закрытия меню */
    Close(): Function;

    /**
     * Метод для поиска элемента по uid
     * @param uid - uid элемента, который хранится в dataSource
     */
    FindByUid(uid: string): Function;

    /**
     * Метод для блокировки или разблокировки кнопок или кнопки
     * @param action - параметр data-action элемента или массив actions
     * @param disabled - true - заблокировать элемент, false - разблокировать
     */
    Disable(action: string | Array<string>, disabled: boolean): Function;

    /**
     * Подписка события
     * @param type - Тип обработки события
     * @param listener - Объект, который принимает уведомление, когда событие указанного типа произошло.
     * @param options - Объект, который определяет характеристики объекта, прослушивающего событие.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): Function;
}

interface DPElementTreeview extends HTMLElement {
    /** Передать/получить объект класса (содержащий исходные данные) для отображения списка */
    dataSource: DPDataSource;
    /** Установить/получить имя ключа объекта модели, в котором хранится текст, по умолчанию 'name' */
    dataTextField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится состояние блокировки, по умолчанию 'disabled' */
    dataDisabledField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится идентификатор, по умолчанию 'id' */
    dataIdField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится идентификатор родительского элемента, по умолчанию 'parentId' */
    dataParentIdField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранятся дочерние элементы, по умолчанию 'children' */
    dataChildrenField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится название иконки или url, по умолчанию 'icon' */
    dataIconField: string;
    /** Установить/получить имя ключа объекта модели, в котором хранится название второй иконки или url, по умолчанию 'secondIcon' */
    secondIconField: string;
    /** Блокировать/разблокировать все элементы, true - заблокировать, возвращает состояние блокировки, по умолчанию - false */
    disabled: boolean;
    /** Включить/отключить dragAndDrop, true - включить, по умолчанию - false */
    dragdrop: boolean;
    /** Включить/отключить режим редактирование, true - включить, по умолчанию - false */
    edit: boolean;
    /** Свернуть/развернуть дерево по горизонтальной оси, false - свернуть компонент, скрыть текст, по умолчанию - true */
    state: boolean;
    /** Разрешить/запретить перемещение вверх или вниз элемента по списку, true - разрешить, по умолчанию - false */
    move: boolean;
    /** Установить максимально допустимое значение отображаемых при первой отрисовки элементов списка, по умолчанию - 50 */
    max: number;
    /** Разрешить создание иконки на основе первых букв текста, если иконка не передается, true - разрешить, по умолчанию - false */
    generateIcon: boolean;
    /**
     * Получить boolean значение возможности сдвига элемента по списку вверх или вниз, false - запрещает сдвиг, true - разрешает
     * @param position.up
     * @param position.down
     */
    position: any;
    /** Получить модель только что развернутой папки, по умолчанию - undefined */
    expanded: any;
    /** Получить модель только что свернутой папки, по умолчанию - undefined */
    collapsed: any;
    /** Получить модель элемента, на котором было открыто контекстное меню в режиме редактирования, по умолчанию - undefined */
    selectedContext: any;
    /**
     * Установить активный элемент, возвращает модель выбранного элемента, по умолчанию - undefined
     * Можно передать id элемента или модель элемента из dataSource.
     */
    select: any;
    /** Получить сбрасываемый узел, по умолчанию - null */
    sourceNode: any;
    /** Получить узел, на который сбрасывается исходный узел, по умолчанию - null */
    destinationNode: any;
    /** Получить значение, куда был сброшен исходный узел, before, after или over, по умолчанию - null */
    dropPosition: any;
    /** Установить название текста при отсутствии данных, по умолчанию - Нет данных */
    noRecord: string;
    /** Получить массив элементов изменивших свою позицию, по умолчанию - [] */
    moved: Array<any>;

    /**
     * Передаем данные в компоненту, после чего происходит перерисовка списка
     * @param data - объект DPDataSource
     */
    SetData(data: DPDataSource): Function;

    /**
     * Разворачивание элементов по id, uid или если значение не передано, всех элементов
     * @param value - значение параметра по которому происходит разворачивание
     * @param param - параметр, по которому происходит разворачивание
     */
    Expand(value?: string, param?: string): Function;

    /**
     * Сворачивание элементов по id, uid или если значение не передано, всех элементов
     * @param value - значение параметра по которому происходит сворачивание
     * @param param - параметр, по которому происходит сворачивание
     */
    Collapse(value?: string, param?: string): Function;

    /** Метод для перемещения выбранного элемента вверх по списку */
    MoveUp(id?: string): Function;

    /** Метод для перемещения выбранного элемента вниз по списку */
    MoveDown(id?: string): Function;

    /**
     * Метод для поиска элемента
     * @param query - значение поиска
     * @param param - параметр, по которому нужно найти элемент, по умолчанию - 'name', можно передать 'id'
     */
    Search(query: string, param?: string): Function;

    /**
     * Метод для блокировки или разблокировки элемента, или элементов
     * @param value - модель элемента, id элемента или список моделей элементов
     * @param disabled - true - заблокировать элемент, false - разблокировать
     */
    Disable(value: any, disabled: boolean): Function;

    /**
     * Подписка события
     * @param type - Тип обработки события
     * @param listener - Объект, который принимает уведомление, когда событие указанного типа произошло.
     * @param options - Объект, который определяет характеристики объекта, прослушивающего событие.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): Function;
}

interface DPElementRegion extends HTMLElement {
    /** Установить/получить текст кнопки, по умолчанию - '' */
    text: string;
    /** Установить/получить состояние области, открыто или закрыто, false - свернуть компонент, по умолчанию - true */
    state: boolean;
    /** Блокировать/разблокировать кнопку, true - заблокировать, возвращает состояние блокировки, по умолчанию - false */
    disabled: boolean;

    /**
     * Подписка события
     * @param type - Тип обработки события
     * @param listener - Объект, который принимает уведомление, когда событие указанного типа произошло.
     * @param options - Объект, который определяет характеристики объекта, прослушивающего событие.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): Function;
}

interface DPElementGrid extends HTMLElement {
    /** получить значение dataSource компонента */
    get dataSource(): DPDataSource;
    /** присвоить значение dataSource компонента
     * для отрисовки новых данных
     */
    set dataSource(dataSource: DPDataSource | null);
    /** получить значение массива моделей столбцов */
    get columns(): Array<
        | DPGridColumn
        | { selectable: boolean; locked?: boolean; field?: string; title?: string; }
        | {
            arrayOfButtons: Array<{
                icon: string;
                action: string;
                title?: string;
                color?: 'primary' | 'red' | 'green';
            }>;
            locked?: boolean;
        }
    >;
    /** присвоить значение массива моделей столбцов */
    set columns(
        columns: Array<
            | DPGridColumn
            | { selectable: boolean; locked?: boolean; field?: string; title?: string; }
            | {
                arrayOfButtons: Array<{
                    icon: string;
                    action: string;
                    title?: string;
                    color?: 'primary' | 'red' | 'green';
                }>;
                locked?: boolean;
            }
        >
    );
    /** получить значение возможности группировки компонента.
     * по умолчанию - false
     */
    get groupable(): boolean | DPGridGroupable;
    /** присвоить значение возможности группировки компонента.
     * по умолчанию - false
     */
    set groupable(groupable: boolean | DPGridGroupable);
    /** получить массив объектов-агрегатов с полями field - значение field столбца, по которому собирается информация,
     * и aggregate - значение, которое собирается.
     * нужен для подсвойства footerTemplate в свойстве columns.
     * по умолчанию - пустой массив.
     */
    get aggregate(): Array<{
        field: string;
        aggregate: 'average' | 'count' | 'max' | 'min' | 'sum';
    }>;
    /** присвоить массив объектов-агрегатов с полями field - значение field столбца, по которому собирается информация,
     * и aggregate - значение, которое собирается.
     * нужен для подсвойства footerTemplate в свойстве columns.
     * по умолчанию - пустой массив.
     */
    set aggregate(
        aggregate: Array<{
            field: string;
            aggregate: 'average' | 'count' | 'max' | 'min' | 'sum';
        }>
    );
    /** получить значение возможности фильтрации компонента.
     * по умолчанию - false
     */
    get filterable(): boolean | DPGridFilterable;
    /** присвоить значение возможности фильтрации компонента.
     * по умолчанию - false
     */
    set filterable(value: boolean | DPGridFilterable);
    /** получить модель/массив моделей(в зависимости от режима свойства selectable) выбранных строк */
    get select(): any;
    /** присвоить модель/массив моделей(в зависимости от режима свойства selectable) выбранных строк */
    set select(value: any | Array<any>);
    /** получить модель строки, в которой произошло нажатие на кнопку в ячейке с кнопками(arrayOfButtons) */
    get selectAction(): Array<any>;
    /** получить значение data-action/action атрибута кнопки/дочернего компонента, нажатой в панели кнопок компонента */
    get toolbarSelectedAction(): string;
    /** получить шаблон строки с подробной информацией о модели */
    get detailTemplate(): string;
    /** присвоить шаблон строки с подробной информацией о модели */
    set detailTemplate(value: string);
    /** получить значение возможности сортировки компонента.
     * по умолчанию - false
     */
    get sortable(): boolean | DPGridSortable;
    /** присвоить значение возможности сортировки компонента.
     * по умолчанию - false
     */
    set sortable(value: boolean | DPGridSortable);
    /** получить значение возможности выбора строк компонента.
     * по умолчанию - false
     */
    get selectable(): boolean | DPGridSelectable;
    /** присвоить значение возможности выбора строк компонента.
     * по умолчанию - false
     */
    set selectable(value: boolean | DPGridSelectable);
    /** получить значение возможности пагинации компонента.
     * по умолчанию - false
     */
    get pageable(): boolean | DPGridPageable;
    /** присвоить значение возможности пагинации компонента.
     * по умолчанию - false
     */
    set pageable(value: boolean | DPGridPageable);
    /** получить значение возможности пагинации компонента.
     * по умолчанию - false
     */
    get editable(): boolean;
    /** присвоить значение возможности пагинации компонента.
     * по умолчанию - false
     */
    set editable(value: boolean);
    /** получить значение возможности изменения ширины столбцов компонента.
     * по умолчанию - false
     */
    get resizable(): boolean;
    /** присвоить значение возможности изменения ширины столбцов компонента.
     * по умолчанию - false
     */
    set resizable(value: boolean);
    /** получить значение наличия меню настройки компонента */
    get columnMenu(): boolean | DPGridColumnMenu;
    /** присвоить значение наличия меню настройки компонента */
    set columnMenu(value: boolean | DPGridColumnMenu);
    /** получить массив моделей кнопок панели кнопок */
    get toolbar(): Array<DPGridToolbarItem>;
    /** присвоить массив моделей кнопок панели кнопок */
    set toolbar(value: Array<DPGridToolbarItem>);
    /** получить значение возможности изменения порядка столбцов */
    get reorderable(): boolean;
    /** присвоить значение возможности изменения порядка столбцов */
    set reorderable(value: boolean);
    /** получить модель строки, которую редактировали */
    get model(): any;
    /** получить модель колонки, которую скрыли/показали или которой изменили ширину */
    get column(): any;
    /** получить номер текущей страницы */
    get currentPage(): number;
    /** присвоить номер текущей страницы и отрендерить */
    set currentPage(value: number);
    /** получить количество страниц компонента */
    get numberOfPages(): number;
    /** получить текст отображаемый при отсутствии данных */
    get noDataMessage(): string;
    /** присвоить текст отображаемый при отсутствии данных */
    set noDataMessage(value: string);
    /** получить массив параметров фильтрации */
    get filteringParams(): Array<{
        field: string;
        value: any;
        operator?: string;
        secondaryValue?: any;
        secondaryOperator?: string;
        logicOperator?: string;
        action?: string;
        onSave: boolean;
    }>;
    /**
     * Автоматически устанавливаем ширину указанной колонки в зависимости от контента
     * @param value - индекс, поле field или сам объект колонки
     */
    AutoFitColumn(value: any): Function;
    /** Автоматически устанавливаем ширину колонок в зависимости от контента */
    AutoFitColumns(): Function;
    /** Сохраняем изменения */
    SaveChanges(): Function;
    /** Отменяем изменения */
    CancelChanges(): Function;
    /** Добавляет пустую строку в начало страницы*/
    AddEmpty(): Function;
    /**
     * Сворачивает переданную группу
     * @param group - элемент группировочной строки или data-groupId группировочной строки
     */
    CollapseGroup(group: string | HTMLTableRowElement): Function;
    /**
     * Разворачивает переданную группу
     * @param group - элемент группировочной строки или data-groupId группировочной строки
     */
    ExpandGroup(group: string | HTMLTableRowElement): Function;
    /**
     * Сворачивает переданную строку(скрывает detailRow)
     * @param row - строка
     */
    ExpandRow(row: string | HTMLTableRowElement): Function;
    /**
     * Разворачивает переданную строку(показывает detailRow)
     * @param row - строка
     */
    CollapseRow(row: string | HTMLTableRowElement): Function;
    /**
     * Прибивает столбец к левому краю таблицы
     * @param column - значение field колонки
     */
    LockColumn(column: string): Function;
    /**
     * Отлепляет столбец от левого края таблицы
     * @param column - значение field колонки
     */
    UnlockColumn(column: string): Function;
    /**
     * Переводим ячейку в режим редактирования
     * @param id - идентификатор строки
     * @param field - поле, по которому определяется колонка
     */
    EditCell(id: string, field: string): Function;
    /** Закрываем ячейку редактирования */
    CloseCell(): Function;
    /**
     * Показываем указанную колонку, если она скрыта
     * @param value - индекс, поле field или сам объект колонки
     */
    ShowColumn(value: any): Function;
    /**
     * Скрываем указанную колонку, если она не скрыта
     * @param value - индекс, поле field или сам объект колонки
     */
    HideColumn(value: any): Function;
    /** Получаем DOM элементы строк */
    Items(): Function;
    /**
     * Изменяем размер указанной колонки
     * @param value - индекс, поле field или сам объект колонки
     * @param width - ширина колонки, которую нужно установить в числовом формате
     */
    ResizeColumn(value: any, width: number): Function;
    /**
     * Перемещаем колонку на указанное положение
     * @param index - индекс, место которого должна занять колонка
     * @param column - объект колонки, который необходимо переместить
     */
    ReorderColumn(index: number, column: any): Function;
    /**
     * фильтруем список. Для внешних фильтров.
     * @param params - массив параметров фильтрации
     */
    Filter(
        params: Array<{
            field: string;
            value: any;
            operator?: string;
            secondaryValue?: any;
            secondaryOperator?: string;
            logicOperator?: string;
            action?: string;
            onSave: boolean;
        }>
    ): Function;
    /**
     * поднять элемент выше
     * @param id - идентификатор элемента
     */
    MoveUp(id?: string | undefined): Function;
    /**
     * отпустить элемент ниже
     * @param id - идентификатор элемента
     */
    MoveDown(id?: string): Function;
}

interface DPGridSortable {
    /**
     * Если установлено, true пользователь может получить сетку в несортированном состоянии, щелкнув заголовок отсортированного столбца. По умолчанию true.
     */
    allowUnsort?: boolean;
    /**
     * Если установлено, true пользователь увидит индикаторы последовательности сортировки для отсортированных столбцов. По умолчанию true.
     */
    showIndexes?: boolean;
    /**
     * Определяет начальное (от несортированного состояния к отсортированному) направление сортировки. Поддерживаемые значения: asc и desc. По умолчанию asc.
     */
    initialDirection?: 'asc' | 'desc';
    /**
     * Режим сортировки. Если установлено значение «один», пользователь может сортировать по одному столбцу.
     * Если установлено значение «несколько», пользователь может сортировать по нескольким столбцам.
     * А «смешанный» режим позволяет сортировать в одиночном режиме при нажатии и переключаться на несколько при удерживании клавиши Ctrl.
     */
    mode?: 'single' | 'multiple' | 'mixed';
}

interface DPGridColumnMenu {
    columns?: boolean;
    filterable?: boolean;
    sortable?: boolean;
    messages?: {
        columns?: string;
        filter?: string;
        sortAcs?: string;
        sortDesc?: string;
    };
}

interface DPGridFilterable {
    extra?: boolean;
    messages?: {
        and?: string;
        buttonTitle?: string;
        clear?: string;
        filter?: string;
        info?: string;
        title?: string;
        isFalse?: string;
        isTrue?: string;
        or?: string;
        search?: string;
        selectValue?: string;
        selectItemsFormat?: string;
        operator?: string;
        addOperator?: string;
        value?: string;
        addValue?: string;
        logic?: string;
        checkAll?: string;
    };
    mode?: string;
    operators: {
        enums?: {
            equal?: string;
            notEqual?: string;
        };
        date?: {
            equal?: string;
            notEqual?: string;
            greaterOrEqual?: string;
            greater?: string;
            lessOrEqual?: string;
            less?: string;
            isEmpty?: string;
            isNotEmpty?: string;
        };
        number?: {
            equal?: string;
            notEqual?: string;
            greaterOrEqual?: string;
            greater?: string;
            lessOrEqual?: string;
            less?: string;
            isEmpty?: string;
            isNotEmpty?: string;
        };
        string?: {
            equal?: string;
            notEqual?: string;
            start?: string;
            contain?: string;
            notContain?: string;
            end?: string;
            isEmpty?: string;
            isNotEmpty?: string;
        };
    };
}

interface DPGridColumn {
    /**
     * Поле, к которому привязан столбец.
     */
    field: string;
    /**
     * Текст заголовка. При отсутствии в качестве текста используется поле field
     */
    title?: string;
    /**
     * Функция создающая input для фильтрации
     */
    editor?: Function;
    /**
     * тип значений в столбце
     */
    type?: string;
    /**
     * хедер группы
     * ДЛЯ ВСЕХ ГРУППОВЫХ ФУТЕРОВ/ХЕДЕРОВ:
     * ОБЯЗАТЕЛЬНО НАЛИЧИЕ СВОЙСТВА AGGREGATES ДЛЯ СТРОКИ С ФУТЕРОМ\ХЕДЕРОМ
     * пример строки: "Total: #: count #"
     * после конвертации будет что-то такое: "Total: 3"
     */
    groupHeaderTemplate?: string;
    /**
     * хедер колонки в группе
     */
    groupHeaderColumnTemplate?: string;
    /**
     * футер группы
     */
    groupFooterTemplate?: string;
    /**
     * футер таблицы.
     * ОБЯЗАТЕЛЬНО НАЛИЧИЕ СВОЙСТВА AGGREGATE В КОМПОНЕНТЕ
     */
    footerTemplate?: string;
    /**
     * рендерит элемент переданный в строке в заголовке
     * пример строки: '<input type="checkbox" id="check-all" /><label for="check-all">Check All</label>',
     */
    headerTemplate?: string;
    /**
     * присваивает классы из массива футеру таблицы
     */
    footerClasses?: Array<string>;
    /**
     * присваивает классы из массива заголовкам
     */
    headerClasses?: Array<string>;
    /**
     * доступность и настройка фильтрации для столбца
     */
    filterable?: boolean | DPGridColumnFilterable;
    /**
     * какие данные собираем для групповых футеров/хедеров
     */
    aggregates?: Array<'count' | 'min' | 'max' | 'sum' | 'average'>;
    /**
     * присваивает классы из массива ячейкам с данными
     */
    classes?: Array<string>;
    /**
     * подуровни заголовков
     */
    columns?: Array<DPGridColumn>;
    /**
     * доступность и настройка редактирования для столбца
     */
    editable?: boolean | Function;
    /**
     * настройка отображения данных(знаки рубля, вид даты)
     */
    format?: string;
    /**
     * доступность и настройка группировки для столбца
     */
    groupable?: boolean | DPGridColumnGroupable;
    /**
     * скрыт ли столбец
     */
    hidden?: boolean;
    /**
     * зафиксирован ли столбец
     */
    locked?: boolean;
    /**
     * можно ли зафиксировать столбец
     */
    lockable?: boolean;
    /**
     * минимальная ширина столбца
     */
    minResizableWidth?: number;
    /**
     * не дошел еще //TODO
     */
    minScreenWidth?: number;
    /**
     * доступность и настройка сортировки для столбца
     */
    sortable?: boolean | DPGridColumnSortable;
    /**
     * ширина столбца
     */
    width?: string | number;
    /**
     * Массив значений, которые будут отображаться вместо связанного значения. Каждый элемент в массиве должен иметь поля text и value
     */
    values?: Array<{ text: string; value: any; }>;
    /**
     * Если установлено, true столбец будет виден в меню столбца сетки
     */
    menu?: boolean;
}

interface DPGridColumnFilterable {
    /**
     * Задает параметры для ячейки заголовка фильтра, когда для режима фильтра задано значение «строка».
     */
    cell?: DGridColumnFilterableCell;
    /**
     * наличие второстепенного значения для фильтрации. по умолчанию - false
     */
    extra?: boolean;
    /**
     * фильтрация с помощью чекбоксов.
     * по умолчанию - false
     */
    multi?: boolean;
    /**
     * текст в меню фильтрации с чекбоксами
     * default: "{0} items selected"
     */
    multiMessage?: string;
    /**
     * наличие кнопки "выделить все чекбоксы".
     * по умолчанию - false
     */
    checkAll?: boolean;
    /**
     * изменить текст операторов
     */
    operators?: any;
    /**
     * наличие поиска в фильтре с чекбоксами
     */
    search?: boolean;
    /**
     * игнорировать регистр при поиске.
     * по умолчанию - true
     */
    ignoreCase?: boolean;
    /**
     * Конфигурация источника данных для элементов, которые будут использоваться при включении columns.filterable.multi.
     */
    dataSource?: Array<any>;
}

interface DGridColumnFilterableCell {
    /**
     * Указывает параметр автозаполнения filter.
     * Возможные значения такие же, как и для параметра автозаполнения filter- "startswith", "endswith", "contains".
     * Оператор "contains"выполняет поиск без учета регистра
     */
    suggestionOperator: string;
    /**
     * Указывает параметр minLength виджета автозаполнения, когда столбец имеет строковый тип.
     * по умолчанию - 1
     */
    minLength: number;
    /**
     * Если установлено значение false, не будет отображать виджет фильтрации ячеек для этого конкретного столбца.
     * по умолчанию - true
     */
    enabled: boolean;
    /**
     * Указывает оператор по умолчанию, который будет использоваться для фильтрации ячеек.
     * по умолчанию - eq
     */
    operator: string;
    /**
     * Указывает, показывать или скрывать DropDownList с операторами.
     * по умолчанию - true
     */
    showOperators: boolean;
}

interface DPGridColumnGroupable {
    /**
     * Задает конфигурацию сортировки при группировке.
     */
    sort?: DPGridColumnGroupableSort;
}

interface DPGridColumnGroupableSort {
    /**
     * Порядок сортировки групп в соответствии с полем группы.
     * Поддерживаемые значения:
     * "asc"(в порядке возрастания)
     * "desc"(в порядке убывания)
     * по умолчанию - "asc"
     */
    dir?: 'asc' | 'desc';
}

interface DPGridColumnSortable {
    /**
     * Определяет исходное (от несортированного состояния к отсортированному) направление сортировки.
     * Поддерживаемые значения: asc и desc.
     * по умолчанию - 'asc'
     */
    initialDirection?: 'asc' | 'desc';
}

interface DPGridGroupable {
    /**
     * При значении false группировка считается отключенной. По умолчанию true.
     */
    enabled?: boolean;
    /**
     * Если этот параметр включен, строки нижнего колонтитула группы останутся видимыми, когда соответствующая группа будет свернута.
     * По умолчанию false.
     */
    showFooter?: boolean;
    /**
     * Задает конфигурацию сортировки при группировке.
     */
    sort?: DPGridGroupableSort;
    /**
     * текст в пустом блоке группировки.
     * по умолчанию - 'Перетащите сюда заголовок столбца таблицы, чтобы сгруппировать строки по этому столбцу'
     */
    emptyMessages?: string;
}

interface DPGridGroupableSort {
    /**
     * Порядок сортировки групп в соответствии с полем группы.
     * Поддерживаемые значения: "asc"(в порядке возрастания), "desc"(в порядке убывания)
     */
    dir?: 'asc' | 'desc';
}

interface DPGridSelectable {
    /**
     * Если установлено значение true, пользователь может перетаскивать мышью, чтобы выбрать несколько строк или ячеек сетки.
     */
    dragToSelect?: boolean;
    /**
     * Можно установить следующие строковые значения:
     * "row" - пользователь может выбрать одну строку.
     * "multiple" — пользователь может выбрать несколько рядов.
     * По умолчанию- "row".
     */
    mode?: string;
}

interface DPGridPageable {
    /**
     * По умолчанию сетка будет отображать пейджер, даже если общее количество элементов в DataSource меньше, чем pageSize.
     * Если установлено значение false сетки, видимость пейджера будет переключаться следующим образом:
     * когда общее количество элементов, изначально установленных в DataSource, меньше числа pageSize, пейджер будет скрыт.
     * когда общее количество элементов, изначально установленных в DataSource, больше или равно числу pageSize, будет показан пейджер.
     * когда общее количество элементов в DataSource становится меньше числа pageSize (после удаления, операции фильтрации или изменения pageSize), пейджер будет скрыт.
     * когда общее количество элементов в DataSource становится больше или равно числу pageSize (после вставки, операции фильтрации или изменения pageSize), будет показан пейджер.
     */
    alwaysVisible?: boolean;
    /**
     * Максимальное количество кнопок, отображаемых на числовом пейджере.
     * Пейджер будет отображать многоточие (...), если количество страниц превышает указанное число.
     */
    buttonCount?: number;
    /**
     * Если установлено, true пейджер будет отображать информацию о текущей странице и общее количество элементов данных.
     * По умолчанию true.
     */
    info?: boolean;
    /**
     * Если установлено, trueпейджер будет отображать элемент ввода, который позволяет пользователю ввести определенный номер страницы.
     * По умолчанию ввод страницы не отображается.
     */
    input?: boolean;
    /**
     * Если установлено, true на пейджере будут отображаться кнопки для перехода к определенным страницам.
     * По умолчанию эти кнопки отображаются.
     */
    numeric?: boolean;
    /**
     * Количество элементов данных, которые будут отображаться в сетке.
     */
    pageSize?: number;
    /**
     * Если установлено true на пейджер, будет отображаться раскрывающийся список, который позволяет пользователю выбрать размер страницы.
     * По умолчанию раскрывающийся список размера страницы не отображается.
     * Может быть установлен в массив предопределенных размеров страниц, чтобы переопределить список по умолчанию.
     * Поддерживается специальное all значение. Он устанавливает размер страницы на общее количество записей.
     */
    pageSizes?: boolean | Array<number | string>;
    /**
     * Определяет положение, в котором будет отображаться пейджер сетки.
     * Допустимые значения: «сверху» и «снизу» (по умолчанию).
     */
    position?: 'top' | 'bottom';
    /**
     * Если установлено, true на пейджере будут отображаться кнопки для перехода на первую, предыдущую, следующую и последнюю страницы.
     * По умолчанию эти кнопки отображаются.
     */
    previousNext?: boolean;
    /**
     * Если установлено, true пейджер будет отображать кнопку обновления.
     * Нажатие кнопки обновления обновит сетку. По умолчанию кнопка обновления не отображается.
     */
    refresh?: boolean;
}

interface DPGridPageableMessages {
    /**
     * Информационный текст пейджера. Использует kendo.format
     * Содержит три заполнителя:
     * {0} — первый индекс элемента данных
     * {1} - индекс последнего элемента данных
     * {2} - общее количество элементов данных
     */
    display?: string;
    /**
     * Текст, отображаемый, когда сетка пуста.
     */
    empty?: string;
    /**
     * Метка, отображаемая перед вводом пейджера.
     */
    page?: string;
    /**
     * Метка, отображаемая перед вводом пейджера. Использует kendo.format .
     * Содержит один необязательный заполнитель {0}, представляющий общее количество страниц.
     */
    of?: string;
    /**
     * Метка отображается после размера страницы DropDownList.
     */
    itemsPerPage?: string;
    /**
     * Подсказка кнопки перехода на первую страницу.
     */
    first?: string;
    /**
     * Подсказка кнопки перехода на последнюю страницу.
     */
    last?: string;
    /**
     * Подсказка кнопки перехода на следующую страницу.
     */
    next?: string;
    /**
     * Подсказка кнопки перехода на предыдущую страницу.
     */
    previous?: string;
    /**
     * Подсказка кнопки обновления.
     */
    refresh?: string;
    /**
     * Подсказка кнопки с многоточием ("..."), которая появляется, когда количество страниц больше, чем buttonCount.
     */
    morePages?: string;
}

interface DPGridToolbarItem {
    /**
     * Для наполнения панели элементами нужно передать в сеттер toolbar массив объектов с информацией об элементе.
     * Для все элементов объект обязательно должен содержать свойство type, в котором хранится строка с тэгом HTML элемента. Например, "dataplat-radio-button" или "button".
     * Для элемента button объект должен содержать свойства: icon - id иконки в спрайте, action и/или id, рекомендуется использовать action. Опционально: title - текст отображаемый при наведении.
     * Для элемента dataplat-radio-button объект должен содержать свойства: icon - id иконки в спрайте, action и/или id, рекомендуется использовать action. Опционально: title - текст отображаемый при наведении, value - значение компонента, iconReplace - подменная иконка компонента(появляется при value равном true).
     * Для элемента dataplat-radio-button объект должен содержать свойства: icon - id иконки в спрайте, action и/или id, рекомендуется использовать action. Опционально: title - текст отображаемый при наведении, value - значение компонента, name - значение атрибута name внутреннего элемента input type="radio".
     * Для элемента dataplat-dropdown-button объект должен содержать свойства: buttons - массив объектов с информацией об элементе. Для объектов массива buttons правила те же, что и для объектов массива items. Опционально: id - id элемента.
     * Для элемента разделителя объект должен содержать только свойство type со значение "separator".
     */
    type:
    | 'button'
    | 'dataplat-checkbox-button'
    | 'dataplat-radio-button'
    | 'separator'
    | 'dataplat-dropdown-button';
    icon?: string;
    name?: string;
    title?: string;
    action?: string;
    value?: boolean;
    buttons?: Array<{ type: 'button'; icon: string; title?: string; action: string; }>;
}
