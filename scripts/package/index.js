import { Component } from './component.js';
import { initializeApp } from './app.js';
import './Directives.js';

document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('app');
    initializeApp(rootElement, Component); 
});