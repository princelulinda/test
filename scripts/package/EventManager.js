export function on(eventName, callback) {
    document.addEventListener(eventName, callback);
}

export function emit(eventName, detail) {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
}
