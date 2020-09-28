import Vue from 'vue';
import { CPU } from './cpu';
import { main } from './main';
import { sources } from "./sources";
import { storage } from './storage';
import AppComponent from './ui/App.vue';

// Variables
let showDebugger = storage.restoreSave('showDebugger', false);
let cpu: CPU;

// DOM elements
let selectGameDOM: HTMLSelectElement;
let switchModeDOM: HTMLButtonElement;
let debuggerViewDOM: HTMLElement;
let perforamnceViewDOM: HTMLElement;

// Sstate save data
const states = {
    performance: {
        consoleLog: console.log,
    },
    debugger: {
        app: null,
    },
};

function startView() {
    if (showDebugger) {
        debuggerViewDOM.style.display = 'block';
        states.debugger.app = new Vue({
            el: '#app',
            template: `
                <app-component :name="name" :initialEnthusiasm="5" />
            `,
            data: { name: 'World' },
            components: {
                AppComponent,
            },
        });
        cpu.video.bindCanvas('fullCanvas');
    } else {
        perforamnceViewDOM.style.display = 'block';
        console.log = () => { };
        cpu.video.bindCanvas('onlyCanvas');
        cpu.start();
    }

    debuggerViewDOM = document.getElementById('app');
    cpu.setDebugging(showDebugger);
    storage.setItem('showDebugger', showDebugger);
}

function destroyView() {
    if (showDebugger) {
        states.debugger.app.$destroy();
        states.debugger.app = null;
        debuggerViewDOM.style.display = 'none';
    } else {
        console.log = states.performance.consoleLog;
        perforamnceViewDOM.style.display = 'none';
    }

}

function toggleView() {
    cpu.stop();

    // Destroy old instance
    destroyView();

    // Toggle debugger
    showDebugger = !showDebugger;

    // Bind again, to new one.
    startView();
}

function fillSelectGame() {
    const games = sources.map((testName) => {
        return testName.replace('./test_roms/', '').replace('.gb', '');
    });

    const options = games.map((gameName) => {
        return `<option>${gameName}</option>`;
    }).join('');

    selectGameDOM.innerHTML = options;
    selectGameDOM.selectedIndex = storage.getItem('selectedGame');
}

function newGameSelected(e) {
    storage.setItem('selectedGame', selectGameDOM.selectedIndex);
    window.location.reload();
}

function domLoaded() {
    switchModeDOM = <HTMLButtonElement>document.getElementById('switchModeButton');
    selectGameDOM = <HTMLSelectElement>document.getElementById('selectGame');
    debuggerViewDOM = document.getElementById('app');
    perforamnceViewDOM = document.getElementById('performance-view');

    initCPU();

    // Bind listeners
    switchModeDOM.addEventListener('click', toggleView);
    selectGameDOM.addEventListener('change', newGameSelected);

    // Initialize elements
    fillSelectGame();

}

function initCPU() {
    main().then((cpuObj) => {
        cpu = cpuObj;
        startView();
    });
}

domLoaded();