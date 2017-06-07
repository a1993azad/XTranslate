import "./text-field.scss";

import * as React from "react";
import { autobind } from "core-decorators";
import { cssNames } from "../../../utils";
import { MaterialIcon } from "../icons/material-icon";
import { Validator, ValidatorError, ValidatorObject, Validators } from "./text-field.validators";

import isFunction = require("lodash/isFunction");
import isString = require("lodash/isString");

export type Props = React.HTMLProps<any> & {
  value?: string | number
  dirty?: boolean
  invalid?: boolean
  compactError?: boolean
  multiLine?: boolean;
  showErrors?: boolean | "all"
  showValidationIcon?: boolean;
  validators?: Validator | Validator[]
  iconLeft?: string | React.ReactNode;
  iconRight?: string | React.ReactNode;
  onChange?: (value: string | number) => void;
}

interface State {
  dirty?: boolean
  dirtyOnBlur?: boolean
  errors?: ValidatorError[]
}

export class TextField extends React.Component<Props, State> {
  public elem: HTMLElement;
  public input: HTMLInputElement | HTMLTextAreaElement;
  private validators: ValidatorObject[] = [];

  static IS_FOCUSED = 'focused';
  static IS_DIRTY = 'dirty';
  static IS_INVALID = 'invalid';
  static IS_EMPTY = 'empty';

  public state: State = {
    dirty: !!(this.props.dirty || this.getValue()),
    errors: [],
  };

  static defaultProps: Props = {
    showErrors: true,
  };

  setValue(newValue: string | number, silent = false) {
    var { value, defaultValue, type, maxLength, min, max, onChange } = this.props;
    var isNumber = type === "number";
    if (isNumber) {
      newValue = +newValue == newValue ? +newValue : "";
    }
    if (value !== newValue) {
      if (defaultValue != null && newValue != null && !this.isFocused) {
        this.input.value = newValue.toString();
      }
      if (!this.isFocused) this.setDirty();
      else if (!this.dirty) this.setState({ dirtyOnBlur: true });

      var preventUpdate = (
        (maxLength > 0 && newValue.toString().length > maxLength) ||
        isNumber && (
          (min != null && newValue < min) ||
          (max != null && newValue > max)
        )
      );
      if (!preventUpdate) {
        if (onChange && !silent) onChange(newValue);
        if (!this.isFocused) this.validate(newValue);
        else setTimeout(() => this.validate(newValue));
      }
    }
  }

  getValue() {
    var { defaultValue, value, type } = this.props;
    if (defaultValue != null) {
      var input = this.input;
      if (!input) return defaultValue as string;
      else {
        var inputVal = input.value;
        if (type === "number") return !isNaN(+inputVal) ? +inputVal : "";
        else return inputVal;
      }
    }
    return value;
  }

  get valid() {
    return !this.state.errors.length;
  }

  get dirty() {
    return this.state.dirty;
  }

  get isFocused() {
    return document.activeElement === this.input
  }

  @autobind()
  focus() {
    if (!this.input) return;
    this.input.focus();
  }

  componentWillMount() {
    this.initValidators();
    this.validate();
  }

  componentWillReceiveProps(nextProps: Props) {
    var { value, dirty, invalid } = this.props;
    if (dirty !== nextProps.dirty) {
      this.setDirty(nextProps.dirty);
    }
    if (value !== nextProps.value) {
      this.setValue(nextProps.value);
    }
    if (invalid !== nextProps.invalid) {
      this.validate();
    }
  }

  componentDidUpdate(oldProps: Props) {
    if (oldProps.value !== this.props.value) {
      this.autoFitHeight();
    }
  }

  componentDidMount() {
    this.autoFitHeight();
    if (this.isFocused) {
      this.elem.classList.add(TextField.IS_FOCUSED);
    }
  }

  protected initValidators() {
    var customValidators = [].concat(this.props.validators || []);

    Object.keys(Validators).forEach(name => {
      var validator = Validators[name];
      if (validator.autoBind && validator.autoBind(this.props)) {
        this.validators.push(validator);
      }
    });
    customValidators.forEach(validator => {
      var validatorObj: ValidatorObject = validator;
      if (isFunction(validator)) validatorObj = { validate: validator };
      this.validators.push(validatorObj);
    });
  }

  validate(value = this.getValue()) {
    var strVal = value != null ? value.toString() : "";
    var valid = true;
    var errors = [];

    for (var validator of this.validators) {
      let { validate, message } = validator;
      valid = valid && validate(strVal, this.props);
      if (!valid) {
        var error = isFunction(message) ? message(strVal, this.props) : message || "";
        errors.push(error);
        if (error && this.props.showErrors !== "all") break;
      }
    }

    this.setState({ errors }, () => {
      this.input.setCustomValidity(valid ? "" : " ");
    });

    return valid;
  }

  setDirty(dirty = true) {
    this.setState({ dirty, dirtyOnBlur: false });
  }

  private autoFitHeight() {
    if (!this.props.multiLine) return;
    var textArea = this.input as HTMLTextAreaElement;
    var lineHeight = parseInt(window.getComputedStyle(textArea).lineHeight);
    var minHeight = lineHeight * (this.props.rows || 1);
    textArea.style.height = "0";
    var paddings = textArea.offsetHeight;
    textArea.style.height = Math.max(minHeight, textArea.scrollHeight) + paddings + "px";
  }

  @autobind()
  private onFocus(evt) {
    if (this.props.onFocus) this.props.onFocus(evt);
    if (this.elem) this.elem.classList.add(TextField.IS_FOCUSED);
  }

  @autobind()
  private onBlur(evt) {
    if (this.props.onBlur) this.props.onBlur(evt);
    if (this.elem) this.elem.classList.remove(TextField.IS_FOCUSED);
    if (this.state.dirtyOnBlur) this.setDirty();
  }

  @autobind()
  private onChange(evt: React.SyntheticEvent<HTMLInputElement>) {
    this.setValue(evt.currentTarget.value);
  }

  @autobind()
  increment() {
    (this.input as HTMLInputElement).stepUp();
    this.setValue(this.input.value);
  }

  @autobind()
  decrement() {
    (this.input as HTMLInputElement).stepDown();
    this.setValue(this.input.value);
  }

  render() {
    var {
      className, iconLeft, iconRight, multiLine, children,
      dirty, invalid, validators, showErrors, showValidationIcon,
      compactError, ...props
    } = this.props;

    var { value, defaultValue, maxLength, rows, type } = this.props;
    var { errors, dirty } = this.state;

    if (isString(iconLeft)) iconLeft = <MaterialIcon name={iconLeft}/>
    if (isString(iconRight)) iconRight = <MaterialIcon name={iconRight}/>

    var inputProps = Object.assign(props, {
      className: "input box grow",
      onBlur: this.onBlur,
      onFocus: this.onFocus,
      onChange: this.onChange,
      rows: multiLine ? (rows || 1) : null,
      ref: e => this.input = e,
    });

    // define input as controlled, if initial value not provided, but onChange handler exists
    var currentValue = this.getValue();
    if (currentValue == null && this.props.onChange) {
      inputProps.value = "";
    }

    var hasErrors = errors.length > 0;
    var componentClass = cssNames('TextField', className, {
      readOnly: props.readOnly,
      [TextField.IS_INVALID]: hasErrors,
      [TextField.IS_DIRTY]: dirty,
      [TextField.IS_FOCUSED]: this.isFocused,
      [TextField.IS_EMPTY]: !currentValue,
    });

    if (showValidationIcon && dirty) {
      var validationIcon = (
        <MaterialIcon
          className={cssNames("validation-icon", { error: hasErrors })}
          name={hasErrors ? "close" : "check"}
          title={errors.filter(isString).join("\n")}
        />
      );
    }
    if (maxLength && multiLine) {
      var maxLengthIndicator = (
        <span className="maxLength">{currentValue == null ? 0 : currentValue.toString().length} / {maxLength}</span>
      );
    }

    return (
      <div className={componentClass} ref={e => this.elem = e}>
        <input type="hidden" disabled={props.disabled}/>
        <label className="label flex gaps align-center">
          {iconLeft}
          {multiLine ? <textarea {...inputProps}/> : <input {...inputProps}/>}
          {validationIcon}
          {iconRight}
          {type === "number" ? (
            <div className="arrow-icons">
              <MaterialIcon name="arrow_drop_up" className="up" onClick={this.increment}/>
              <MaterialIcon name="arrow_drop_down" className="down" onClick={this.decrement}/>
            </div>
          ) : null}
        </label>
        {maxLengthIndicator}
        {children}
        {showErrors ? (
          <div className={cssNames("errors", { compact: compactError })}>
            {dirty ? errors.map((error, i) => <div key={i} className="error">{error}</div>) : null}
          </div>
        ) : null}
      </div>
    );
  }
}
