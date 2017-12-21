<template>
    <div id="root">
        <h1>GameboyTS Debugger</h1>
        <div v-if="gameTitle">
            <span>You're playing</span>
            <b>{{ gameTitle }}</b>
        </div>

        <running-commands-component></running-commands-component>
        <register-component></register-component>
        <span id="lastExecuted">{{ state.lastExecuted.readable }}</span>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { cpu } from "./../main";

import RegisterComponent from "./components/Registers.vue";
import RunningCommandsComponent from "./components/RunningCommands.vue";

export default Vue.extend({
    data () {
        return {
            gameTitle: cpu.rom.gameTitle,
            state: cpu.state,
        }
    },
    components: {
        RegisterComponent,
        RunningCommandsComponent
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