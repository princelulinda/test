import { globalState } from './StateManager';
import { emit } from './EventManager';

export class Component {
    constructor(data = {}) {
        this._data = new Proxy(data, {
            set: (target, key, value) => {
                target[key] = value;
                globalState.set(key, value);
                this.updateDOM({ [key]: value });
                return true;
            }
        });
    }

    async callServerMethod(methodName, ...args) {
        emit('request.start');
        try {
            const formData = new FormData();
            formData.append('component', 'submitform'); 
            formData.append('method', methodName.expression || methodName);
            args.forEach((arg, index) => formData.append(`param${index}`, typeof arg === 'object' ? JSON.stringify(arg) : arg));
            
            const response = await fetch('/', {
                method: "POST",
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                body: formData 
            });

            if (response.redirected) window.location.replace(response.url);
            
            const data = await response.json();
            const rootElement = document.getElementById('app');
            
            if (data.html.navigate) navigateTo(data.html.url);
            if (rootElement) {
                morphdom(rootElement, data.html, {
                    onBeforeElUpdated: (fromEl, toEl) => {
                        if (fromEl.tagName === 'INPUT' && fromEl.type === 'text') {
                            toEl.value = fromEl.value;
                            return false; 
                        }
                        return true;
                    }
                });
            }
        } catch (error) {
            console.error('Erreur:', error.message);
        } finally {
            emit('request.end');
        }
    }

    updateDOM(newData) {
        for (const key in newData) {
            const element = document.querySelector(`[b-text=${key}]`);
            if (element) element.textContent = newData[key];
        }
    }
}
