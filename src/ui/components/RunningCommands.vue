<template>
    <div id="running-commands">
        <button @click="cpuStep()">Step</button>
        <button @click="cpuStart()">Run</button>
        <button @click="cpuStop()">Stop</button>
        <input type="checkbox" v-model="state.stepMode" />Single frame
    </div>
</template>

<script>
import { cpu } from "./../../main";
export default {
    data: function() {
        return {
            state: cpu.state,
        }
    },
    methods: {
        cpuStep() {
            cpu.step();
        },
        cpuStart() {
            cpu.start();
        },
        cpuStop() {
            cpu.stop();
        },
    }
};
</script>


<style lang="scss">
#running-commands {
    margin: 0 auto;
    width: 340px;
    input, button {
        margin: 5px 2px;
        border: 2px solid #666;
    }
    #cpu-frequency {
        width: 60px;
    }
}
</style>