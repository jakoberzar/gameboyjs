<template>
    <div id="root">
        <h1>GameboyTS Debugger</h1>
        <div v-if="gameTitle">
            <span>You're playing</span>
            <b>{{ gameTitle }}</b>
        </div>
        <register-component></register-component>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { cpu } from "./../main";

import RegisterComponent from "./components/Registers.vue";

export default Vue.extend({
    data () {
        return {
            gameTitle: cpu.rom.gameTitle,
        }
    },
    components: {
        RegisterComponent,
    }
});
</script>

<style>
body {
    background-color: #222;
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
#root {
    width: 800px;
    margin: 0 auto;
}
.greeting {
    font-size: 20px;
}
</style>