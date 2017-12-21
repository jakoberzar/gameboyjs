<template>
    <div id="registers">
        <h2>Registers</h2>
        <div class="register" v-for="reg in registerData">
            <span>{{ reg.name.toUpperCase() }}: </span><input type="text" v-model="reg.value">
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { cpu } from "./../../main";
import { RegNameValue } from "./../../registers";

export default Vue.extend({
    props: [],
    data() {
        return {
            registers: cpu.registers,
        }
    },
    methods: {
    },
    computed: {
        registerData(): RegNameValue[] {
            return this.registers.getAllValues();
        }
    }
});
</script>

<style lang="scss">
    #registers {
        width: 300px;
    }
    // .register {
    //     &:nth-child(even) {
    //     }
    // }
    .register {
        display: inline-block;
        margin: 5px 5px;
        span {
            width: 25px;
            display: inline-block;
            text-align: right;
            margin-right: 5px;
        }
        input {
            width: 100px;
            font-family: Courier New, Courier, monospace;
            font-size: 16px;
        }
    }
</style>


