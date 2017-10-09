import { CPU } from './cpu';
import { ByteFileReader } from './file';
import { Memory } from './memory';
import { Registers } from './registers';
import { Rom, RomInstruction } from './rom';

const gbROM = './test_roms/pokemon_red.gb';

function main() {

    ByteFileReader.loadFile(gbROM).then((val) => {
        let rom: Rom = val;
        let c: CPU = new CPU();
        c.setRom(val);

        rom.makeInstructions().then(() => {
            c.registers.pc = 0x151;
            while (rom.instAt(c.registers.pc) == null) {
                c.registers.pc++;
            }
            for (let j = 0; j < 1000000; j++) {
                c.readNext();
            }
            console.log('done');
            c.debugging = true;
            c.readNext();
            console.log(c.executedLog);
        });
    });
}

main();
