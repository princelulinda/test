// directives.js
import { emit, on } from './events';
import { getCookie } from './utils';
import { StateManager } from './stateManager';
import { Component } from './component';

const customDirectiveNames = new Set();

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

export function initializeDirectives() {
    directive('text', ({ el, component, directive }) => {
        el.textContent = component._data[directive.expression];
    });
    
    directive('click', ({ el, component, directive }) => {
        el.addEventListener('click', async () => {
            const params = extractParams(directive); 
            const methodName = directive.expression.split("(")[0].trim(); 
            await component.callServerMethod({ expression: methodName }, params);
        });
    });

    // Ajoutez toutes les autres directives ici
}
