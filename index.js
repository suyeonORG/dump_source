#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, 'config.json'));

function parseArgs() {
    const args = process.argv.slice(2);
    const argObj = { lang: null, ext: [], ignoreFiles: [], command: null, help: false };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (arg === '-lang' || arg === '--lang') {
            i++;
            argObj.lang = args[i];
        } else if (arg === '-ext' || arg === '--ext') {
            i++;
            while (i < args.length && !args[i].startsWith('-')) {
                argObj.ext.push(args[i]);
                i++;
            }
            continue;
        } else if (arg === '-h' || arg === '--help') {
            argObj.help = true;
        } else if (arg === 'ignore') {
            argObj.command = 'ignore';
            i++;
            argObj.ignoreFiles = args.slice(i);
            break;
        } else if (arg === 'reset') {
            argObj.command = 'reset';
        } else {
            console.error(`Unknown argument: ${arg}`);
            process.exit(1);
        }
        i++;
    }
    return argObj;
}

const args = parseArgs();

if (args.help) {
    printHelp();
    process.exit(0);
}

if (args.command === 'ignore') {
    if (args.ignoreFiles.length === 0) {
        console.error('No files specified to ignore.');
        process.exit(1);
    }
    addToIgnoreList(args.ignoreFiles);
    process.exit(0);
}

if (args.command === 'reset') {
    resetIgnoreList();
    process.exit(0);
}

let allowedExtensions = [];

if (args.lang) {
    const langKey = findLanguage(args.lang.toLowerCase());

    if (!langKey) {
        console.error(`No configuration found for language "${args.lang}" in ${__dirname}`);
        process.exit(1);
    }

    const langConfig = config[langKey];
    const langExtensions = langConfig.file_extensions;

    allowedExtensions = allowedExtensions.concat(langExtensions);
}

if (args.ext.length > 0) {
    allowedExtensions = allowedExtensions.concat(args.ext);
}

if (allowedExtensions.length === 0) {
    console.error('Usage: dump_source -lang <language> [-ext <extensions>]');
    console.error('At least one language or extension must be specified.');
    process.exit(1);
}

allowedExtensions = [...new Set(allowedExtensions)];

let ignoreList = [];
const ignoreFilePath = path.join(process.cwd(), 'ignore.json');
try {
    if (fs.existsSync(ignoreFilePath)) {
        const ignoreData = fs.readFileSync(ignoreFilePath, 'utf8');
        const ignoreObj = JSON.parse(ignoreData);
        ignoreList = Object.values(ignoreObj);
    }
} catch (err) {
    console.error(`Error reading ignore.json:`, err);
}

let ignorePatterns = [];
try {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    ignorePatterns = gitignore
        .split('\n')
        .filter(line => line.trim() !== '' && !line.startsWith('#'));
} catch (err) {
}

function isIgnored(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    for (const pattern of ignorePatterns) {
        if (pattern.endsWith('/')) {
            if (relativePath.startsWith(pattern)) {
                return true;
            }
        } else {
            if (relativePath === pattern) {
                return true;
            }
        }
    }
    return false;
}

function shouldExcludeFile(filePath) {
    const baseName = path.basename(filePath);
    if (
        (baseName === '.env' ||
            baseName === 'constant' ||
            baseName === 'constants') &&
        baseName !== '.example.env'
    ) {
        return true;
    }
    return false;
}

let includedFiles = [];

function processFile(filePath) {
    if (isIgnored(filePath)) {
        return;
    }
    if (shouldExcludeFile(filePath)) {
        return;
    }

    const relativePath = path.relative(process.cwd(), filePath);
    const baseName = path.basename(filePath);

    if (ignoreList.includes(relativePath) || ignoreList.includes(baseName)) {
        return;
    }

    const ext = path.extname(filePath);
    if (
        !allowedExtensions.includes(ext) &&
        !allowedExtensions.includes(baseName)
    ) {
        return;
    }
    includeFile(filePath);
}

function includeFile(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return;
    }
    includedFiles.push({
        path: relativePath,
        content: content,
    });
}

function walkDir(dir) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
        return;
    }
    for (const f of files) {
        const fullPath = path.join(dir, f);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch (err) {
            console.error(`Error getting stats of ${fullPath}:`, err);
            continue;
        }
        if (stat.isDirectory()) {
            if (isIgnored(fullPath)) {
                continue;
            }
            if (
                ['node_modules', '.git', '.svn', '.hg', '.DS_Store', '__pycache__'].includes(
                    f
                )
            ) {
                continue;
            }
            walkDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

function writeMarkdown() {
    const markdownContent = includedFiles
        .map(file => {
            return `\`\`\`${file.path}\n${file.content}\n\`\`\``;
        })
        .join('\n\n');
    
    const timestamp = new Date().toISOString();
    
    const filename = `dump-${timestamp}.md`.replace(/:/g, '-');
    try {
        fs.writeFileSync(filename, markdownContent, 'utf8');
        console.log(`Dump created: ${filename}`);
    } catch (err) {
        console.error('Error writing dump.md:', err);
    }
}

function findLanguage(inputLang) {
    for (const langKey in config) {
        const langConfig = config[langKey];
        if (langKey.toLowerCase() === inputLang) {
            return langKey;
        }
        if (langConfig.abbreviations) {
            if (langConfig.abbreviations.map(abbr => abbr.toLowerCase()).includes(inputLang)) {
                return langKey;
            }
        }
    }
    return null;
}

function printHelp() {
    console.log(`Usage: dump_source [options]

Options:
    -lang <language>      Specify the language to include (from config.json)
    -ext <extensions...>  Specify additional file extensions to include
    -h, --help            Show this help message

Commands:
    ignore <filenames...> Add files to the ignore list
    reset                 Reset the ignore list

Examples:
    dump_source -lang c -ext .html .css
    dump_source ignore filename1.js filename2.js
    dump_source reset
`);
}

function addToIgnoreList(files) {
    const ignoreFilePath = path.join(process.cwd(), 'ignore.json');
    let ignoreObj = {};

    try {
        if (fs.existsSync(ignoreFilePath)) {
            const ignoreData = fs.readFileSync(ignoreFilePath, 'utf8');
            ignoreObj = JSON.parse(ignoreData);
        }
    } catch (err) {
        console.error(`Error reading ignore.json:`, err);
    }

    const existingKeys = Object.keys(ignoreObj).map(k => parseInt(k)).filter(k => !isNaN(k));
    let nextKey = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 1;

    files.forEach(file => {
        const resolvedPath = path.relative(process.cwd(), file);
        if (!Object.values(ignoreObj).includes(resolvedPath)) {
            ignoreObj[nextKey.toString()] = resolvedPath;
            nextKey++;
        }
    });

    try {
        fs.writeFileSync(ignoreFilePath, JSON.stringify(ignoreObj, null, 2), 'utf8');
        console.log(`Added to ignore list: ${files.join(', ')}`);
    } catch (err) {
        console.error(`Error writing to ignore.json:`, err);
    }
}

function resetIgnoreList() {
    const ignoreFilePath = path.join(process.cwd(), 'ignore.json');

    try {
        fs.writeFileSync(ignoreFilePath, '{}', 'utf8');
        console.log('Ignore list has been reset.');
    } catch (err) {
        console.error(`Error resetting ignore.json:`, err);
    }
}

walkDir(process.cwd());
writeMarkdown();
