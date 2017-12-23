<template>
    <div id="app-component">
        <h1>GameboyTS Debugger</h1>
        <div v-if="gameTitle">
            <span>You're playing</span>
            <b>{{ gameTitle }}</b>
        </div>
        <running-commands-component></running-commands-component>
        <div id="app-grid">
            <register-component></register-component>
            <memory-component></memory-component>
            <instructions-component></instructions-component>
        </div>
        <span id="lastExecuted" v-if="state.lastExecuted">{{ state.lastExecuted.readable }}</span>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { cpu } from "./../main";

import RegisterComponent from "./components/Registers.vue";
import RunningCommandsComponent from "./components/RunningCommands.vue";
import MemoryComponent from "./components/Memory.vue";
import InstructionsComponent from "./components/Instructions.vue";

export default Vue.extend({
    data () {
        return {
            gameTitle: cpu.rom.gameTitle,
            state: cpu.state,
        }
    },
    components: {
        RegisterComponent,
        RunningCommandsComponent,
        MemoryComponent,
        InstructionsComponent,
    }
});
</script>

<style>
body {
    background-color: #222;
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
#app-component {
    width: 800px;
    margin: 0 auto;

}
#app-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
    grid-auto-rows: minmax(100px, auto);
}
</style>