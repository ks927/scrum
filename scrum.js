// TODO:
    // list function to show all scrums. takes a number or all.
    // edit lines
    // delete lines
    // add option to add personal items

let args = process.argv.slice(2).map(e => e.toLowerCase());
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

let today = new Date();
const fs = require('fs');
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
const yyyy = today.getFullYear();
today = `${mm}-${dd}-${yyyy}`;
const thisMonthDir = `./${mm}-${yyyy}/`;

let scrum = {
    today: [],
    next: [],
    blocks: []
}
let category;

// https://gist.github.com/lot224/23f3382f654353d4084b5e9359c7b20c
const c = {
    Color: (code, msg) => { return `${code}${msg}\x1b[0m`;},
    Blue: (msg) => { return c.Color(`\x1b[34m`, msg); },
    Green: (msg) => { return c.Color(`\x1b[32m`, msg); },
    Red: (msg) => { return c.Color(`\x1b[31m`, msg); },
    Yellow: (msg) => { return c.Color(`\x1b[33m`, msg); },
}

const fn = {
    init: () => {
        console.log('dude cmon init', today)

        if (fs.existsSync(`./${thisMonthDir}/${today}.txt`)) {
            var scrumToday = fs.readFileSync(`./${thisMonthDir}/${today}.txt`, 'utf-8');
            if (scrumToday) scrum = JSON.parse(scrumToday);
        }

        if (args && args[0]) {
            switch(args[0]) {
                case 'task':
                    return fn.add();
                    break;
                case 'category':
                    return console.log('not implemented yet...');
                    break;
                case 'show':
                    let date = args[1] ?? null;
                    fn.show(today, date);
                    process.exit(1);
                    break;
                }
            }
            
        fn.show(today);
        fn.ask();
    },

    ask: () => {
        readline.question(`what would you like to do?
[1] Add an item
[2] Edit an item
[3] Add a category
[4] Save and quit\n`, (answer) => {
            if (answer === '1') {
                fn.add();
            } else if (answer === '2') {
                fn.edit();
            } else if (answer === '4') {
                fn.done();
            } else {
                console.log('not implemented yet...');
                return fn.ask();
            }
        });
    },

    // for some reason this fn doesn't have access to today scope variable
    show: (argToday, date=null) => {
        if (date !== null && date.toLowerCase() === 'yesterday') {
            fn.findLastScrum();
        }
        var today = scrum.today.map(task => c.Green(`${task}\n`));
        var next = scrum.next.map(task => c.Blue(`${task}\n`));
        var blocks = scrum.blocks.map(task => c.Red(`${task}\n`));

        return console.log(`Today: ${today}\n` +
            `Next: ${next}\n` +
            `Blocks: ${blocks}\n`);
    },

    findLastScrum: () => {
        let count = 1;
        let temp = dd;
        if (temp === 1) {
            temp = 32;
        }
        let previousDay = temp - count;
        if (previousDay < 10) {
            previousDay = `0${previousDay}`;
        }
        let lastScrum;

        if (fs.existsSync(`./${thisMonthDir}/${mm}-${previousDay}-${yyyy}.txt`)) {
            lastScrum = fs.readFileSync(`${thisMonthDir}/${mm}-${previousDay}-${yyyy}.txt`, 'utf-8')
            scrum = JSON.parse(lastScrum);
            return;
        }

        while (!fs.existsSync(`./${thisMonthDir}/${mm}-${previousDay}-${yyyy}.txt`)) {
            if (count === 100) {
                console.log(c.Red("Could not find yesterday's scrum"));
                return;
            }
            count++;
            previousDay = temp - count;
            if (previousDay < 10) {
                previousDay = `0${previousDay}`;
            }
            
            if (fs.existsSync(`./${thisMonthDir}/${mm}-${previousDay}-${yyyy}.txt`)) {
                lastScrum = fs.readFileSync(`${thisMonthDir}/${mm}-${previousDay}-${yyyy}.txt`, 'utf-8')
                scrum = JSON.parse(lastScrum);
                return;
            }
        }

    },

    add: () => {
        readline.question("To what would you like to add? [1]Today / [2]Next / [3]Roadblock?\n", (answer) => {
            choice = answer == 1 ? 'today' : answer == 2 ? 'next' : answer == 3 ? 'blocks' : fn.add();
            category = choice;

            if (!Object.keys(scrum).includes(category)) {
                return fn.add();
            }
            return fn.today();

        });
    },

    edit: () => {
        readline.question(`Which category would you like to edit?
        [1] Today
        [2] Next
        [3] Blocks?\n`,
        (category) => {
            switch(category.toLowerCase()) {
                case '1' || 'today':
                    console.log(scrum.today.map((task, idx) => `${task}`));
                    break;
                case '2' || 'next':
                    console.log(scrum.next.map((task, idx) => `${task}`));
                    break;
                case '3' || 'roadblocks':
                    console.log(scrum.blocks.map((task, idx) => `${task}`));
                    break;
                default:
                    console.log('try again')

            }

            readline.question(`Which task would you like to edit?\n`,
            (answer) => {
                console.log('switch', answer)
                scrum.today.map((task, idx) => idx.toString() === answer &&
                    console.log(`${task}`));
                    
                readline.question(`Update what ${answer} should reader:\n`,
                (update) => {
                    scrum.today[answer] = '[' + answer.toString()+ ']' + update;
                    console.log(scrum);
                    fn.done();
                });

            });
        })
    },

    today: () => {
        readline.question(`What would you like to add to ${category}?\n`, (answer) => {
            fn.addTask(answer);
        })
    },

    addTask: (task) => {
        scrum[category].push(`[${scrum[category].length}]${task}`);

        console.log(`added '${task}' to ${category}`);
        args = null;

        return readline.question("Anything else? Y/N\n", (answer) => {
            if (answer.toLocaleLowerCase()[0] === "y") {
                fn.save();
                fn.init();
            } else {
                fn.done();
            }
        });
    },

    done: () => {
        readline.question("All done? Type [Y]es to save this into a .txt file\n", (answer) => {
            if (answer.toLocaleLowerCase()[0] === 'y') {
                fn.save();
                readline.close();
            } else {
                fn.init();
            }
        });
    },

    save: () => {
        if (!fs.existsSync(`./${thisMonthDir}`)) {
            fs.mkdirSync(`./${thisMonthDir}`);
        }

        fs.writeFile(`./${thisMonthDir}/${today}.txt`, JSON.stringify(scrum, null, 2), function(err) {
            if (err) throw err;
        });
    }
}

fn.init();