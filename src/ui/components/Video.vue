<template>
    <div id="video">
        <canvas id="fullCanvas" height="144" width="160" />
    </div>
</template>

<script>
import { cpu } from "./../../main";

export default {
    data: function() {
        return {
        }
    },
    computed: {

    },
    methods: {

    },
    mounted () {
        cpu.video.bindCanvas('fullCanvas');
    }
};
</script>


<style lang="scss">
#instructions {
    margin: 0 auto;
    width: 100%;
    min-width: 300px;
    min-height: 300px;
    input, button {
        margin: 5px 2px;
        border: 2px solid #666;
    }

}
</style>