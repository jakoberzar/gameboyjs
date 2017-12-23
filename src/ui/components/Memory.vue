<template>
    <div id="memory">
        <div class="grid">
            <div class="memory-row header">
                <div class="memory-cell"></div>
                <div class="memory-cell" v-for="i in 16">
                    {{ intToNiceHex(i - 1) }}
                </div>
            </div>
            <div class="memory-row" v-for="(row, index) in field">
                <div class="memory-cell header">
                    {{ intToNiceHex(index * 16) }}
                </div>
                <div class="memory-cell" v-for="cell in row" :class="{ gray: cell.unused}" :title="cell.mouseover">
                    {{ cell.hexValue }}
                </div>
            </div>
        </div>
        <div class="memory-grid-controls">
            <button @click="previousPage()">Previous</button>
            <input type="text" v-model="startLocationHex"></input>
            -
            <input type="text" v-model="endLocationHex"></input>
            <button @click="nextPage()">Next</button>
        </div>
    </div>
</template>

<script>
import _ from "lodash";
import { cpu } from "./../../main";

export default {
    data: function() {
        return {
            lastAccessed: cpu.lastAccessed,
            field: [],
            startLocation: 0x00,
            perRow: 16,
            perPage: 16 * 16,
        }
    },
    computed: {
        startLocationHex: {
            get() {
                return this.startLocation.toString(16).padStart(4, '0').toUpperCase();
            },
            set(val) {
                if (val.length != 4 || val.substring(2,4) != "00") return;
                this.startLocation = parseInt(val, 16);
                this.updateMemory();
            }
        },
        endLocationHex: {
            get() {
                return (this.startLocation + this.perPage - 1).toString(16).padStart(4, '0').toUpperCase();
            },
            set(val) {
                if (val.length != 6 || val.substring(2,4) != "FF") return;
                this.startLocation = (parseInt(val, 16) - this.perPage + 1);
                this.updateMemory();
            }
        }
    },
    methods: {
        intToNiceHex(val, padding = 2) {
            return val.toString(16).padStart(padding, '0').toUpperCase();
        },

        nextPage() {
            if ((this.startLocation + this.perPage) < 0xFFFF) {
                this.startLocation += this.perPage;
            }
            this.updateMemory();
        },

        previousPage() {
            if ((this.startLocation - this.perPage) >= 0x0) {
                this.startLocation -= this.perPage;
            }
            this.updateMemory();
        },
        updateMemory() {
            const sparseElements = cpu.memory.readMultiple(this.startLocation, this.perPage);
            // const pad2 = (val) = ("00" + val).
            const elements = [...sparseElements]
                .map((element, index) => {
                    const n = element ? element : 0;
                    const address = index + this.startLocation;
                    const mouseOverText =
                        'Address: 0x' + this.intToNiceHex(index + this.startLocation) + '\n' +
                        'Decimal: ' + n + '\n' +
                        'Binary: ' +
                            Math.floor(n / 16).toString(2).padStart(4, '0') + ' ' +
                            (n % 16).toString(2).padStart(4, '0');

                    return {
                        unused: element == undefined,
                        value: n,
                        hexValue: this.intToNiceHex(n),
                        mouseover: mouseOverText,
                    }
                });
            this.field = _.chunk(elements, this.perRow);

        }
    },
    mounted () {
        this.updateMemory();
    }
};
</script>


<style lang="scss">
#memory {
    width: 583px;
    grid-row: 1 / 3;
    grid-column: 2 / 4;
    .memory-cell {
        display: inline-block;
        margin: 5px;
        width: 24px;
    }

    .memory-grid-controls {
        width: 290px;
        margin: 5px auto;
        div, button, input {
            display: inline-block;
            margin: 0px 5px;
        }
        input {
            width: 33px;
        }
    }
}

.gray {
    color: #888;
}

.header {
    color: rgb(61, 91, 190);
}


</style>