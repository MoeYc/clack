import { State } from "@clack/core";
import { TextPrompt, SelectPrompt, ConfirmPrompt, block } from "@clack/core";
import color from 'picocolors';
import { cursor, erase } from 'sisteransi';

export { isCancel } from "@clack/core";

const symbol = (state: State) => {
    switch (state) {
        case 'initial':
        case 'active': return color.cyan('●')
        case 'cancel': return color.red('■')
        case 'error': return color.yellow('▲')
        case 'submit': return color.green('✔')
    }
}

const barStart = '┌';
const bar = '│';
const barEnd = '└';

export interface TextOptions {
    message: string;
    placeholder?: string;
    validate?: ((value: string) => string | void);
}
export const text = (opts: TextOptions) => {
    return new TextPrompt({
        validate: opts.validate,
        render() {
            const title = `${color.gray(bar)}\n${symbol(this.state)}  ${opts.message}\n`;
            const placeholder = opts.placeholder ? color.inverse(opts.placeholder[0]) + color.dim(opts.placeholder.slice(1)) : color.inverse(color.hidden('_'));
            const value = !this.value ? placeholder : this.valueWithCursor;

            switch (this.state) {
                case 'error': return `${title.trim()}\n${color.yellow(bar)}  ${value}\n${color.yellow(barEnd)}  ${color.yellow(this.error)}\n`;
                case 'submit': return `${title}${color.gray(bar)}  ${color.dim(this.value)}`;
                case 'cancel': return `${title}${color.gray(bar)}  ${color.strikethrough(color.dim(this.value))}${this.value.trim() ? '\n' + color.gray(bar) : ''}`;
                default: return `${title}${color.cyan(bar)}  ${value}\n${color.cyan(barEnd)}\n`;
            }
        }
    }).prompt();
}

export interface ConfirmOptions {
    message: string;
    active?: string;
    inactive?: string;
    initialValue?: boolean;
}
export const confirm = (opts: ConfirmOptions) => {
    const active = opts.active ?? 'Yes';
    const inactive = opts.inactive ?? 'No';
    return new ConfirmPrompt({
        active,
        inactive,
        initialValue: opts.initialValue ?? true,
        render() {
            const title = `${color.gray(bar)}\n${symbol(this.state)}  ${opts.message}\n`;
            const value = this.value ? active : inactive;

            switch (this.state) {
                case 'submit': return `${title}${color.gray(bar)}  ${color.dim(value)}`;
                case 'cancel': return `${title}${color.gray(bar)}  ${color.strikethrough(color.dim(value))}\n${color.gray(bar)}`;
                default: {
                    return `${title}${color.cyan(bar)}  ${this.value ? `${color.green('◼')} ${active}` : `${color.dim('◻')} ${color.dim(active)}`} ${color.dim('/')} ${!this.value ? `${color.green('◼')} ${inactive}` : `${color.dim('◻')} ${color.dim(inactive)}`}\n${color.cyan(barEnd)}\n`;
                }
            }
        }
    }).prompt();
}

interface Option {
    value: any;
    label?: string;
    hint?: string;
}
export interface SelectOptions<Options extends Option[]> {
    message: string;
    options: Options;
    initialValue?: Options[number]['value'];
}
export const select = <Options extends Option[]>(opts: SelectOptions<Options>) => {
    const opt = (option: Options[number], state: 'inactive' | 'active' | 'selected' | 'cancelled') => {
        const label = option.label ?? option.value;
        if (state === 'active') {
            return `${color.green('◼')} ${label} ${option.hint ? color.dim(`(${option.hint})`) : ''}`
        } else if (state === 'selected') {
            return `${color.dim(label)}`
        } else if (state === 'cancelled') {
            return `${color.strikethrough(color.dim(label))}`
        }
        return `${color.dim('◻')} ${color.dim(label)}`;
    }

    return new SelectPrompt({
        options: opts.options,
        initialValue: opts.initialValue,
        render() {
            const title = `${color.gray(bar)}\n${symbol(this.state)}  ${opts.message}\n`;

            switch (this.state) {
                case 'submit': return `${title}${color.gray(bar)}  ${opt(this.options[this.cursor], 'selected')}`;
                case 'cancel': return `${title}${color.gray(bar)}  ${opt(this.options[this.cursor], 'cancelled')}\n${color.gray(bar)}`;
                default: {
                    return `${title}${color.cyan(bar)}  ${this.options.map((option, i) => opt(option, i === this.cursor ? 'active' : 'inactive')).join(`\n${color.cyan(bar)}  `)}\n${color.cyan(barEnd)}\n`;
                }
            }
        }
    }).prompt();
}

export const cancel = (message = '') => {
    process.stdout.write(`${color.gray(barEnd)}  ${color.red(message)}\n\n`);
}

export const intro = (title = '') => {
    process.stdout.write(`${color.gray(barStart)}  ${title}\n`);
}

export const outro = (message = '') => {
    process.stdout.write(`${color.gray(bar)}\n${color.gray(barEnd)}  ${color.green(message)}\n\n`);
}

export const spinner = () => {
    let unblock: () => void;
    let loop: NodeJS.Timer;
    return {
        start(message = '') {
            message = message.replace(/\.\.\.$/, '');
            unblock = block();
            process.stdout.write(`${color.gray(bar)}\n${color.magenta('◆')}  ${message}\n`);
            let i = 0;
            loop = setInterval(() => {
                process.stdout.write(cursor.move(-999, -2));
                process.stdout.write(erase.down(2))
                process.stdout.write(`${color.gray(bar)}\n${color.magenta('◆')}  ${message}${i ? '.'.repeat(i) : ''}\n`);
                i = i > 2 ? 0 : i + 1;
            }, 300)
        },
        stop(message = '') {
            process.stdout.write(cursor.move(-999, -2));
            process.stdout.write(erase.down(2))
            clearInterval(loop);
            process.stdout.write(`${color.gray(bar)}\n${color.gray('◆')}  ${message}\n`);
            unblock();
        }
    }

}
