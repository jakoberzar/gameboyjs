import * as _ from "es6-promise";
import { CPU } from './cpu';
import { Memory } from './memory';
import { MyFileReader, Rom, RomInstruction } from './file';

const gbROM = "./test_roms/pokemon_red.gb";

function main() {
    let c: CPU = new CPU();
    let mem: Memory = new Memory();
    MyFileReader.loadFile(gbROM).then((val) => {
        let rom: Rom = val;

        rom.makeInstructions().then(x => {
            // Test output of first 0x40 instructions.
            let i = 0x150;
            while (i < 0x190) {
                let ri: RomInstruction = rom.instAt(i);
                if (ri == null) {
                    i++;
                    continue;
                }
                console.log(`0x${i.toString(16)}: ${ri.readable.toString()}`);
                i += ri.instruction.byteLength;
            }
        });
    });
}

main();
