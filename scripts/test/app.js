let customDirectiveNames = new Set();
let components = new Map();

function matchesForCustomDirective(attributeName) {
    return attributeName.match(/^b-/);
}

function extractDirective(el, name) {
    let [value, ...modifiers] = name.replace(/^b-/, '').split('.');
    if (!value) return;
    return new Directive(value, modifiers, name, el);
}

function directive(name, callback) {
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

function on(eventName, callback) {
    document.addEventListener(eventName, callback);
}

function emit(eventName, detail) {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

class StateManager {
    constructor() {
        this.state = {};
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        this.state[key] = value;
        this.notifyComponents(key);
    }

    notifyComponents(key) {
        components.forEach(component => {
            if (component._data.hasOwnProperty(key)) {
                component.updateDOM({ [key]: this.state[key] });
            }
        });
    }
}

const globalState = new StateManager();

class Component {
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

    // Appel serveur pour une méthode et mise à jour du DOM avec morphdom
    async callServerMethod(methodName, ...args) {
        document.dispatchEvent(new Event('request.start')); // Émet l'événement de début de requête
        try {
            const formData = new FormData();
            formData.append('component', 'submitform'); 
            formData.append('method', methodName.expression || methodName); 

            // Ajout des paramètres
            if (args.length > 0) {
                args.forEach((arg, index) => {
                    if (typeof arg === 'object') {
                        formData.append(`param${index}`, JSON.stringify(arg));
                        console.log('argument', arg);
                        
                    } else {
                        formData.append(`param${index}`, arg);
                    }
                });
            }
            const response = await fetch('/', {
                method: "POST",
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData 
            });

            console.log('Réponse du serveur:', response);

            if (!response.ok) {
                if (response.redirected) {
                    fetch('/scripts/error.html')
                    .then(res=>res.text())
                    .then(error=>{     
                         document.body.innerHTML = error
                          document.querySelector('[error-message]').textContent =  window.location.search
                          }
                     
                    )
                }
            }

               if (response.redirected){
                  window.location.replace(response.url)
                
               }
                const data = await response.json();
                console.log('Données reçues:', data);
    
                const rootElement = document.getElementById('app'); 
            if(data.html["navigate"]){
                navigateTo(data.html['url'])
            }   
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
            } else {
                console.error('Erreur : l\'élément racine est introuvable.');
            }
        } catch (error) {
            console.error('Erreur:', error.message);
        } finally {
            document.dispatchEvent(new Event('request.end')); // Émet l'événement de fin de requête
        }
    }

    updateDOM(newData) {
        for (const key in newData) {
            if (newData.hasOwnProperty(key)) {
                const element = document.querySelector(`[b-text=${key}]`);
                if (element) {
                    element.textContent = newData[key];
                }
            }
        }
    }
}

// Classe pour représenter une directive
class Directive {
    constructor(value, modifiers, rawName, el) {
        this.rawName = this.raw = rawName;
        this.el = el;
        this.eventContext = {};
        this.value = value;
        this.modifiers = modifiers;
        this.expression = this.el.getAttribute(this.rawName);
    }

    get method() {
        return this.value;
    }

    get params() {
        const regex = /\(([^)]+)\)/; 
        const match = this.el.getAttribute(this.rawName).match(regex);
        if (match) {
            const paramsArray = match[1].split(',').map(param => param.trim());
            return paramsArray.reduce((acc, param) => {
                acc[param] = this.el.getAttribute(param); 
                return acc;
            }, {});             
        }

        // Vérification pour les formulaires et les inputs
        if (this.el.tagName.toLowerCase() === 'form') {
            const params = {};
            const modelDirectives = this.el.querySelectorAll('[b-model], [b-upload]');

            modelDirectives.forEach(directiveEl => {
                const directiveName = directiveEl.getAttribute('b-model') || directiveEl.getAttribute('b-upload');
                params[directiveName] = directiveEl.value;
            });

            return params; 
        }

        return {}; 
    }
}

// Mise à jour de la méthode pour extraire les paramètres de manière uniforme
function extractParams(directive) {
    const params = directive.params; 
    return {
        param: Object.keys(params).map(key => ({
            name: key,
            value: params[key]
        }))
    };
}

// Directive b-text pour afficher du texte
directive('text', ({ el, component, directive }) => {
    el.textContent = component._data[directive.expression];
});

// Directive b-click pour gérer les clics
directive('click', ({ el, component, directive }) => {
    el.addEventListener('click', async () => {
        try {
            const params = extractParams(directive); 
            const par = params.param.reduce((index, acc) => {
                return acc.value = acc.name;
            }, 0);
            
            const methodName = directive.expression.split("(")[0].trim(); 
            
            await component.callServerMethod({ expression: methodName }, params);
        } catch (error) {
            console.error('Erreur lors de l\'appel de la méthode serveur:', error);
        }
    });
});
directive("valided",({el,component, directive})=>{
    fetch('/',{
        method:"POST",  
        body:'valided',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
    })
    if (el.tagName == "form"){
        el.querySelectorAll("[b-model]")
        .forEach((child)=>{

        })
    }
    
})
// Directive b-model pour la liaison de données
directive('model', ({ el, component, directive }) => {
    const updateModel = () => {
        component._data[directive.expression] = el.value;
    };

    el.addEventListener('input', updateModel);
    el.value = component._data[directive.expression] || '';
});

// Directive b-submit pour la soumission des formulaires
directive('submit', ({ el, component, directive }) => {
    el.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const params = extractParams(directive);
            console.log(params);
            
            await component.callServerMethod(directive, params);
        } catch (error) {
            console.error('Erreur lors de la soumission du formulaire:', error);
        }
    });
});

directive('live', ({ el, directive, component }) => {    
    const debounceTime = parseInt(directive.expression) || 300; 
    let timeout;
    let lastExecution = 0;

    const executeLiveUpdate = async () => {
        try {
            await component.callServerMethod({ expression: el.getAttribute(`b-${directive.value}`) }, [el.value]);
        } catch (error) {
            console.error('Erreur lors de la mise à jour en direct:', error);
        }
    };

    const handleEvent = (event) => {
        const now = Date.now();
        
        const filters = directive.modifiers;         
        let shouldUpdate = true; 
        
        filters.forEach(filter => {
            if (filter === 'debounce') {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    executeLiveUpdate();
                }, debounceTime);
                shouldUpdate = false; 
            } else if (filter === 'throttle') {
                if (now - lastExecution >= debounceTime) {
                    lastExecution = now;
                    if (shouldUpdate) {
                        executeLiveUpdate();
                    }
                }
                shouldUpdate = false; 
            } else if (filter === 'filter') {
                const filterCondition = filters[1]; 
                if (filterCondition && !el.value.includes(filterCondition)) {
                    shouldUpdate = false; 
                }
            }
        });
    };

    el.addEventListener('input', handleEvent);
});

directive('focus', ({ el }) => {
    el.focus();
});

directive('blur', ({ el, directive }) => {
    el.addEventListener('blur', () => {
        // Ajoutez ici le code pour gérer l'événement blur si nécessaire
    });
});

directive('show', ({ el, component, directive }) => {
    const updateVisibility = () => {
        el.style.display = component._data[directive.expression] ? '' : 'none';
    };
    updateVisibility();
    component.updateDOM = (newData) => {
        if (newData.hasOwnProperty(directive.expression)) {
            updateVisibility();
        }
    };
});

// Directive b-change pour gérer les changements de valeur
directive('change', ({ el, component, directive }) => {
    const debounceTime = parseInt(directive.modifiers.find(mod => mod.includes('debounce'))) || 300;
    let timeout;
    let lastExecution = 0;

    const executeChangeUpdate = async () => {
        try {
            const params = directive.params; 
            await component.callServerMethod({ expression: el.getAttribute(`b-${directive.value}`) }, [el.getAttribute('b-model'), el.value]);
        } catch (error) {
            console.error('Erreur lors de la mise à jour avec changement:', error);
        }
    };

    const handleEvent = (event) => {
        const now = Date.now();
        let shouldUpdate = true;

        directive.modifiers.forEach(modifier => {
            if (modifier === 'debounce') {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    executeChangeUpdate();
                }, debounceTime);
                shouldUpdate = false;
            } else if (modifier === 'throttle') {
                if (now - lastExecution >= debounceTime) {
                    lastExecution = now;
                    if (shouldUpdate) {
                        executeChangeUpdate();
                    }
                }
                shouldUpdate = false;
            } else if (modifier === 'filter') {
                const filterCondition = directive.modifiers[1];
                if (filterCondition && !el.value.includes(filterCondition)) {
                    shouldUpdate = false;
                }
            }
        });

        if (shouldUpdate) {
            executeChangeUpdate();
        }
    };

    el.addEventListener('change', handleEvent);
});

// Directive b-upload pour gérer les téléversements de fichiers
directive('upload', ({ el, component, directive }) => {
    const debounceTime = parseInt(directive.modifiers.find(mod => mod.includes('debounce'))) || 300;
    let timeout;
    let lastExecution = 0;

    const executeUpload = async (files) => {
        try {
            const formData = new FormData();
            Array.from(files).forEach((file, index) => {
                formData.append(`file${index}`, file);
            });
           
            // Assurez-vous que 'callServerMethod' utilise FormData et non JSON
            await component.callServerMethod({
                expression: directive.expression,
                isFileUpload: true, 
            }, formData);
        } catch (error) {
            console.error('Erreur lors du téléversement de fichier:', error);
        }
    };

    const handleUpload = (event) => {
        const now = Date.now();
        let shouldUpload = true;

        directive.modifiers.forEach(modifier => {
            if (modifier === 'debounce') {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    executeUpload(el.files);
                }, debounceTime);
                shouldUpload = false;
            } else if (modifier === 'throttle') {
                if (now - lastExecution >= debounceTime) {
                    lastExecution = now;
                    if (shouldUpload) {
                        executeUpload(el.files);
                    }
                }
                shouldUpload = false;
            }
        });

        if (shouldUpload) {
            executeUpload(el.files);
        }
    };

    // Support pour téléversement multiple si modificateur 'multiple' est présent
    if (directive.modifiers.includes('multiple')) {
        el.setAttribute('multiple', true);
    }

    el.addEventListener('change', handleUpload);
});

// Directive b-navigate pour gérer la navigation
directive('navigate', ({ el }) => {
    el.addEventListener('click', async (event) => {
        event.preventDefault();
        const url = el.getAttribute('href'); 
        if (url) {
            await navigateTo(url);
        }
    });
});

// Fonction pour gérer la navigation
async function navigateTo(url) {
    document.dispatchEvent(new Event('navigation.start')); // Émet l'événement de début de navigation
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement de la page');
        }
        const data = await response.text();
        const rootElement = document.getElementById('app');
        
        rootElement.innerHTML = data;
        
        // Réinitialiser les directives sur le nouveau contenu
        initializeApp(rootElement, Component);
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        document.dispatchEvent(new Event('navigation.end')); // Émet l'événement de fin de navigation
    }
}

// Écouteur d'événements pour gérer les changements d'état de l'historique
window.addEventListener('popstate', async (event) => {
    const url = location.pathname;
    await navigateTo(url);
});

function initializeApp(rootElement, componentClass) {
    const component = new componentClass();
    components.set(rootElement, component);

    const directives = Array.from(rootElement.querySelectorAll('*'))
        .flatMap(el => Array.from(el.attributes)
            .filter(attr => matchesForCustomDirective(attr.name))
            .map(attr => extractDirective(el, attr.name)));

    directives.forEach(directive => {
        emit('directive.init', { el: directive.el, component, directive });
    });

    return component;
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('app');
    initializeApp(rootElement, Component); 
});

// Directive isloading pour afficher un élément pendant la requête serveur
directive('isloading', ({ el, component, directive }) => {
    const originalDisplay = el.style.display; // Sauvegarde de l'affichage original

    const showLoading = () => {
        el.style.display = 'block'; // Affiche l'élément
        el.classList.add(directive.modifiers.join(' ')); // Ajoute les classes de style
    };

    const hideLoading = () => {
        el.style.display = originalDisplay; // Restaure l'affichage original
        el.classList.remove(...directive.modifiers); // Supprime les classes de style
    };

    // Écoute les événements de début et de fin de la requête
    document.addEventListener('request.start', showLoading);
    document.addEventListener('request.end', hideLoading);
});

// Directive topload pour afficher un élément pendant la navigation
directive('topload', ({ el, directive }) => {
    const originalDisplay = el.style.display; // Sauvegarde de l'affichage original

    const showLoading = () => {
        el.style.display = 'block'; // Affiche l'élément
        el.classList.add(...directive.modifiers); // Ajoute les classes de style
    };

    const hideLoading = () => {
        el.style.display = originalDisplay; // Restaure l'affichage original
        el.classList.remove(...directive.modifiers); // Supprime les classes de style
    };

    // Écoute les événements de début et de fin de navigation
    document.addEventListener('navigation.start', showLoading);
    document.addEventListener('navigation.end', hideLoading);
});
