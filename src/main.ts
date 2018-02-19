import { CPU } from './cpu';
import { ByteFileReader } from './file';
import { Memory } from './memory';
import { Registers } from './registers';
import { Rom, RomInstruction } from './rom';

const tests = [
    './test_roms/pokemon_red.gb',
    './test_roms/dr_mario_usa.gb',
    './test_roms/tetris.gb',
    './test_roms/bgbtest.gb',

    './test_roms/blargg/cpu_instrs/cpu_instrs.gb',
    // 5
    './test_roms/blargg/cpu_instrs/individual/01-special.gb', // POP AF - Failed #5
    './test_roms/blargg/cpu_instrs/individual/02-interrupts.gb', // Timer doesn't work - Failed #4
    './test_roms/blargg/cpu_instrs/individual/03-op sp,hl.gb', // Falls out of memory
    './test_roms/blargg/cpu_instrs/individual/04-op r,imm.gb', // DE Failed - SBC
    './test_roms/blargg/cpu_instrs/individual/05-op rp.gb', // Passed :)
    // 10
    './test_roms/blargg/cpu_instrs/individual/06-ld r,r.gb', // Passed :)
    './test_roms/blargg/cpu_instrs/individual/07-jr,jp,call,ret,rst.gb', // Falls out of memory
    './test_roms/blargg/cpu_instrs/individual/08-misc instrs.gb', // Falls out of memory
    './test_roms/blargg/cpu_instrs/individual/09-op r,r.gb', // Falls out of memory
    './test_roms/blargg/cpu_instrs/individual/10-bit ops.gb', // Passed :)
    './test_roms/blargg/cpu_instrs/individual/11-op a,(hl).gb', // 9E 27 Failed - SBC & DAA
];

const testNumber = 5;

const gbROM = tests[testNumber];

export let cpu: CPU = new CPU();

export async function main() {
    return new Promise<CPU>((resolve, reject) => {
        ByteFileReader.loadFile(gbROM).then((val) => {
            let rom: Rom = val;
            cpu.setRom(val);
            // while (rom.instAt(cpu.registers.pc) == null) {
            //     cpu.registers.pc++;
            // }

            // let startTime = performance.now();
            // let instructionN = 500000;
            // for (let j = 0; j < instructionN; j++) {
            //     cpu.readNext();
            // }
            // let endTime = performance.now();
            // let msSpent = endTime - startTime;
            // console.log('Executed ' + instructionN +
            //     ' in ' + (endTime - startTime) + ' => ' +
            //     instructionN / msSpent / 1000 + ' mHz');
            // console.log('done');
            cpu.debugging = true;
            // cpu.step();
            // console.log(cpu.executedLog);
            resolve(cpu);
        });

    });

}
