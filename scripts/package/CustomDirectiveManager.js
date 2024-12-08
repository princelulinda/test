export const customDirectiveNames = new Set();

export function directive(name, callback) {
    if (customDirectiveNames.has(name)) {
        console.warn(`La directive '${name}' est déjà enregistrée.`);
        return;
    }
    customDirectiveNames.add(name);
    document.addEventListener('directive.init', (event) => {
        const { el, component, directive } = event.detail;
        if (directive && directive.value === name) {
            callback({ el, directive, component, $b: component });
        }
    });
}

export function matchesForCustomDirective(attributeName) {
    return attributeName.match(/^b-/);
}
