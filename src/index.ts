import Vue from 'vue';
import { main } from './main';
import AppComponent from './ui/App.vue';

main().then((cpu) => {
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
});