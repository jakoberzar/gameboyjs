import { CPU } from './cpu';
import { Memory } from './memory';
import { MyFileReader, Rom } from './file';
import * as _ from "es6-promise";

const gbROM = "./test_roms/pokemon_red.gb";

function main() {
    let c: CPU = new CPU();
    let mem: Memory = new Memory();
    MyFileReader.loadFile(gbROM).then((val) => {
        let rom: Rom = val;
    });
}

main();
