import * as _ from "es6-promise";
import { CPU } from './cpu';
import { Memory } from './memory';
import { MyFileReader, Rom } from './file';
import { instruction, bytesToInstruction, ins, readableInstruction } from './instructions';

const gbROM = "./test_roms/pokemon_red.gb";

function main() {
    let c: CPU = new CPU();
    let mem: Memory = new Memory();
    MyFileReader.loadFile(gbROM).then((val) => {
        let rom: Rom = val;
        let myInstructions: instruction[] = [];
        let i = 0x150;
        while (i < 0x170) {
            let myBytes = rom.take(i, 3);
            let instr: instruction = bytesToInstruction(myBytes);
            myInstructions.push(instr);
            i += instr.byteLength;
            let readable = new readableInstruction(instr, myBytes);
            console.log(readable.toString());
        }
        console.log(myInstructions);
    });
}

main();
