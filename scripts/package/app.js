// scripts/app.js
export function initializeApp(rootElement, componentClass) {
    const component = new componentClass();
   
    const directives = Array.from(rootElement.querySelectorAll('*'))
        .flatMap(el => Array.from(el.attributes)
            .filter(attr => matchesForCustomDirective(attr.name))
            .map(attr => extractDirective(el, attr.name)));

    directives.forEach(directive => {
        emit('directive.init', { el: directive.el, component, directive });
    });
    
    return component;
}

function emit(eventName, detail) {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

function matchesForCustomDirective(attributeName) {
    return attributeName.match(/^b-/);
}

function extractDirective(el, name) {
    let [value, ...modifiers] = name.replace(/^b-/, '').split('.');
    if (!value) return; 
    return new Directive(value, modifiers, name, el);
}