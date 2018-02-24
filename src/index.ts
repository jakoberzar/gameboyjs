import Vue from 'vue';
import { CPU } from './cpu';
import { main } from './main';
import AppComponent from './ui/App.vue';

let showDebugger = false;
let cpu: CPU;

const states = {
    performance: {
        consoleLog: console.log,
    },
    debugger: {
        app: null,
    },
};

main().then((cpuObj) => {
    cpu = cpuObj;
    startView();
});

function startView() {
    if (showDebugger) {
        document.getElementById('app').style.display = 'block';
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
        console.log = () => {};
        cpu.video.bindCanvas('onlyCanvas');
        cpu.start();
    }

    cpu.setDebugging(showDebugger);
}

function destroyView() {
    if (showDebugger) {
        states.debugger.app.$destroy();
        states.debugger.app = null;
        document.getElementById('app').style.display = 'none';
    } else {
        console.log = states.performance.consoleLog;
    }

}

document.getElementById('switchModeButton').addEventListener('click', (element) => {
    cpu.stop();

    // Destroy old instance
    destroyView();

    // Toggle debugger
    showDebugger = !showDebugger;

    // Bind again, to new one.
    startView();
});