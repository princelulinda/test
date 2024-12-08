export class Directive {
    constructor(value, modifiers, rawName, el) {
        this.rawName = this.raw = rawName;
        this.el = el;
        this.value = value;
        this.modifiers = modifiers;
        this.expression = this.el.getAttribute(this.rawName);
    }

    get method() {
        return this.value;
    }

    get params() {
        const regex = /\(([^)]+)\)/;
        const match = this.expression.match(regex);
        if (match) {
            return match[1].split(',').reduce((acc, param) => {
                acc[param.trim()] = this.el.getAttribute(param.trim());
                return acc;
            }, {});
        }

        if (this.el.tagName.toLowerCase() === 'form') {
            const params = {};
            this.el.querySelectorAll('[b-model], [b-upload]').forEach(directiveEl => {
                const directiveName = directiveEl.getAttribute('b-model') || directiveEl.getAttribute('b-upload');
                params[directiveName] = directiveEl.value;
            });
            return params;
        }

        return {};
    }
}
