<template>
    <div id="registers">
        <h2>Registers</h2>
        <div class="register" v-for="reg in registerData">
            <span>{{ reg.name.toUpperCase() }}: </span>
            <input type="text" v-model="reg.value" :title="mouseOverText(reg.value)"/>
        </div>
    </div>
</template>

<script>
import { cpu } from "./../../main";
import { RegNameValue } from "./../../registers";

export default {
    props: [],
    data() {
        return {
            registers: cpu.registers,
        }
    },
    methods: {
        intToNiceHex(val, padding = 2) {
            return val.toString(16).padStart(padding, '0').toUpperCase();
        },
        mouseOverText (n) {
            const mouseOverText =
                'Hex: ' + this.intToNiceHex(n, 4) + '\n' +
                'Decimal: ' + n + '\n' +
                'Binary: ' +
                    Math.floor(n / 0x100).toString(2).padStart(8, '0') + ' ' +
                    (n % 0x100).toString(2).padStart(8, '0');
            return mouseOverText;
        }
    },
    computed: {
        registerData() {
            return this.registers.getAllValues().map(obj => {
                obj.value = obj.value.toString(16).toUpperCase();
                return obj;
            });
        }
    }
};
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
            width: 60px;
            font-family: Courier New, Courier, monospace;
            font-size: 16px;
        }
    }
</style>


