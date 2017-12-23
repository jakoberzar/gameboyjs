<template>
    <div id="instructions">
        <div v-for="instruction in instructionsEnhanced">
            <div class="instruction"
                :class="{ active: instruction.active, gray: !instruction.active }">
                <!-- <div class="breakpoint"
                    @click="toggleBreakpoint(instruction.pc, instruction.breakpoint)">
                    <span v-if="instruction.breakpoint">
                        <span v-if="instruction.active">🔵</span>
                        <span v-else>🔴</span>
                    </span>
                    <span class="no-breakpoint" v-else>
                        <span class="breakpoint-hover">🔴</span>
                    </span>
                </div> -->
                <div class="address">{{ '0x' + intToNiceHex(instruction.address, 4) }}</div>
                <div class="mnemonic">{{ instruction.readable }}</div>
                <!-- <div class="operands">{{ instruction.operands }}</div> -->
            </div>
        </div>
        <div class="instruction-list-controls">
            <button @click="resetPage()">Reset (PC)</button>
            <input type="text" v-model="startLocationHex"></input>
            (<input type="text" id="amount" v-model="amount"></input>)
            <button @click="nextPage()">Next</button>
        </div>

    </div>
</template>

<script>
import { cpu } from "./../../main";

export default {
    data: function() {
        return {
            instructions: cpu.currentInstructions,
            // breakpoints: cpu.breakpoints,
            instructionRange: cpu.currentInstructionRange,
        }
    },
    computed: {
        instructionsEnhanced() {
            return this.instructions.map(instruction => {
                // instruction.breakpoint = false;
                // if (this.breakpoints.some(bp => bp.address == instruction.pc)) {
                //     instruction.breakpoint = true;
                // }
                instruction.active = cpu.registers.pc == instruction.address;
                return instruction;
            });
        },
        startLocationHex: {
            get() { return this.intToNiceHex(this.instructionRange.start, 4) },
            set(val) {
                if (val.length != 4) return;
                this.instructionRange.start = parseInt(val, 16);
                cpu.updateCurrentInstructions();
            }
        },
        amount: {
            get() { return this.instructionRange.amount },
            set(val) {
                this.instructionRange.amount = val;
                cpu.updateCurrentInstructions();
            }
        },

    },
    methods: {
        intToNiceHex(val, padding = 2) {
            return val.toString(16).padStart(padding, '0').toUpperCase();
        },
        // toggleBreakpoint(pc, active) {
        //     if (!active) {
        //         cpu.breakpoints.push({address: pc});
        //     } else {
        //         const idx = cpu.breakpoints.findIndex(bp => bp.address == pc);
        //         cpu.breakpoints.splice(idx, 1);
        //     }
        // },
        resetPage() {
            this.instructionRange.start = cpu.registers.pc;
            cpu.updateCurrentInstructions();
        },
        nextPage() {
            this.instructionRange.start = this.instructionRange.end + 1;
            cpu.updateCurrentInstructions();
        },

    }
};
</script>


<style lang="scss">
#instructions {
    margin: 0 auto;
    width: 100%;
    min-width: 300px;
    grid-row: 2 / 4;
    grid-column: 1;
    input, button {
        margin: 5px 2px;
        border: 2px solid #666;
    }

    .instruction {
        padding: 2px 4px;
        &.active {
            border: 1px solid rgb(61, 91, 190);

        }
        .address, .mnemonic, .operands, .breakpoint {
            display: inline-block;
        }
        .breakpoint {
            width: 20px;
            .no-breakpoint{
                display: inline-block;
                width: 100%;
                cursor: default;
            }
            .breakpoint-hover {
                opacity: 0;
                &:hover {
                    opacity: 0.3;
                }
            }
        }
        // .address {
        //     width: 70px;
        // }
        // .mnemonic {
        //     width: 50px;
        // }
    }

    .instruction-list-controls {
        width: 290px;
        margin: 5px auto;
        div, button, input {
            border: 0px;
            display: inline-block;
            margin: 0px 5px;
        }
        input {
            width: 50px;
        }
        #amount {
            width: 16px;
        }
    }
}
</style>