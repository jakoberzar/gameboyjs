<template>
    <div id="app">
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
        <video-component></video-component>
        <!-- <span id="lastExecuted" v-if="state.lastExecuted">{{ state.lastExecuted.readable }}</span> -->
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { cpu } from "./../main";

import RegisterComponent from "./components/Registers.vue";
import RunningCommandsComponent from "./components/RunningCommands.vue";
import MemoryComponent from "./components/Memory.vue";
import InstructionsComponent from "./components/Instructions.vue";
import VideoComponent from "./components/Video.vue";

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
        VideoComponent,
    }
});
</script>

<style>
#app {
    width: 1000px;
    margin: 0 auto;

}
#app-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
    grid-auto-rows: minmax(100px, auto);
}
</style>