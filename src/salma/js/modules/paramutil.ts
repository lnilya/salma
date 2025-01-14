import {ReactNode} from "react";
import {
    CheckboxParams,
    Condition,
    DropDownParams,
    DType, ListSelectionEntry, ListSelectionParams,
    Parameter,
    SeparatorParams,
    SliderInputParams,
    TextInputParams, TreeSelectionLeaf, TreeSelectionNode, TreeSelectionParams
} from "./paramtypes";
import {RecoilState} from "recoil";

/**
 * Create a text input parameter
 * @param key Unique parameter-key
 * @param title Title displayed in UI
 * @param description Description displayed in UI
 * @param placeholder optional placeholder for text-field
 * @param defaultVal optional default value
 * @param conditional optional display condition
 */
export function getTextfieldInputParams(
    key: string,
    title: ReactNode,
    description: ReactNode,
    placeholder: string = 'Value...',
    defaultVal: string = '',
    conditional: Condition = null,
    frontendOnly: boolean = false,
    inputType: 'text' | 'number' = 'text'
): Parameter<TextInputParams> {
    
    return {
        key: key,
        dtype: inputType == 'number' ? DType.Float : DType.String,
        input: {
            type: "text_input",
            defaultVal: defaultVal,
            placeholder: placeholder,
            inputtype: inputType
        },
        display: {
            title: title,
            hint: description
        },
        frontendOnly: frontendOnly,
        conditional: conditional || ((s) => 'active')
    }
}

export function getDropdownParams(key: string,
                                  title: ReactNode,
                                  description: ReactNode,
                                  defaultVal: string = '',
                                  options: Record<string, string>,
                                  conditional: Condition = null,
                                  frontendOnly: boolean = false): Parameter<DropDownParams> {
    
    return {
        key: key,
        dtype: DType.String,
        input: {
            type: "dropdown",
            defaultVal: defaultVal,
            options: options
        },
        display: {
            title: title,
            hint: description
        },
        frontendOnly: frontendOnly,
        conditional: conditional || ((s) => 'active')
    }
}

export function getListSelectionParams(key: string,
                                       title: ReactNode,
                                       description: ReactNode,
                                       defaultVal: string = '',
                                       options: Array<ListSelectionEntry>,
                                       conditional: Condition = null,
                                       frontendOnly: boolean = false,
                                       numVisEntries: number = 3): Parameter<ListSelectionParams> {
    
    return {
        key: key,
        dtype: DType.String,
        input: {
            type: "listselection",
            defaultVal: defaultVal,
            options: options,
            numVisEntries: numVisEntries
        },
        display: {
            title: title,
            hint: description
        },
        frontendOnly: frontendOnly,
        conditional: conditional || ((s) => 'active')
    }
}

export function getTreeSelectionParams(key: string,
                                       title: ReactNode,
                                       description: ReactNode,
                                       defaultVal: string = '',
                                       options: TreeSelectionNode,
                                       conditional: Condition = null,
                                       frontendOnly: boolean = false): Parameter<TreeSelectionParams> {
    
    return {
        key: key,
        dtype: DType.String,
        input: {
            type: "tree",
            defaultVal: defaultVal,
            options: options
        },
        display: {
            title: title,
            hint: description
        },
        frontendOnly: frontendOnly,
        conditional: conditional || ((s) => 'active')
    }
}


export function getSliderParams(key: string,
                                title: ReactNode,
                                description: ReactNode,
                                min: number,
                                max: number,
                                step: number,
                                defaultVal: number | [number, number],
                                invert: boolean = false,
                                conditional: Condition = null,
                                frontendOnly: boolean = false): Parameter<SliderInputParams> {
    
    return {
        key: key,
        dtype: DType.Float,
        input: {
            type: "slider",
            defaultVal: Array.isArray(defaultVal) ? defaultVal : [defaultVal],
            min: min,
            max: max,
            invert: invert,
            stepsize: step
        },
        display: {
            title: title,
            hint: description
        },
        frontendOnly: frontendOnly,
        conditional: conditional || ((s) => 'active')
    }
}

export function getTitleSeparatorParams(key: string,
                                        title: ReactNode,
                                        subtitle: ReactNode,
                                        conditional: Condition = null): Parameter<SeparatorParams> {
    
    return {
        key: key,
        dtype: DType.Float,
        input: {
            type: "separator",
        },
        display: {
            title: title,
            hint: subtitle
        },
        frontendOnly: true,
        uiOnly: true,
        conditional: conditional || ((s) => 'active')
    }
}

export function getCheckboxParams(key: string,
                                  title: ReactNode,
                                  description: ReactNode,
                                  label: string,
                                  defaultVal: boolean,
                                  conditional: Condition = null,
                                  frontendOnly: boolean = false): Parameter<CheckboxParams> {
    
    return {
        key: key,
        dtype: DType.Bool,
        input: {
            type: "checkbox",
            defaultVal: defaultVal,
            label: label
        },
        display: {
            title: title,
            hint: description
        },
        frontendOnly: frontendOnly,
        conditional: conditional || ((s) => 'active')
    }
}