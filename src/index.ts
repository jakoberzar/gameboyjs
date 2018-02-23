import Vue from 'vue';
import { cpu, main } from './main';
import AppComponent from './ui/App.vue';

const showDebugger = false;

main().then((cpu) => {
    if (showDebugger) {
        let v = new Vue({
            el: '#app',
            template: `
                <app-component :name="name" :initialEnthusiasm="5" />
            `,
            data: { name: 'World' },
            components: {
                AppComponent,
            },
        });
    } else {
        const clog = console.log;
        console.log = () => {};
        cpu.video.bindCanvas('onlyCanvas');
        cpu.start();
    }

});