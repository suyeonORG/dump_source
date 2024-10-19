# dump_source

A `NodeJS` command-line tool to create a comprehensive markdown dump of your source code files, filtered by programming language or file extensions, while respecting ignore patterns.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
  - [Options](#options)
  - [Commands](#commands)
  - [Examples](#examples)
- [Configuration](#configuration)
- [Ignore List](#ignore-list)
- [Notes](#notes)
- [License](#license)

## Installation

Install `dump_source` globally using npm:

```bash
npm install -g dump_source
```

## Features

- **Language-Based Filtering**: Include files based on specified programming languages.
- **Extension-Based Filtering**: Include additional files by specifying file extensions.
- **Custom Ignore List**: Exclude specific files or directories using an ignore list.
- **Respects `.gitignore`**: Automatically ignores files and directories specified in your `.gitignore`.
- **Markdown Output**: Generates a markdown file containing your source code, organized and easy to read.
- **Timestamped Output**: Output files are timestamped to prevent overwriting previous dumps.

## Usage

Run `dump_source` in your project directory to create a markdown dump of your source code files.

### Options

- `-lang <language>`: Specify the programming language to include. The language should correspond to a key in the `config.json` file.
- `-ext <extensions...>`: Specify additional file extensions to include (e.g., `.html`, `.css`, `.py`).
- `-h`, `--help`: Display the help message with usage instructions.

### Commands

- `ignore <filenames...>`: Add files or directories to the ignore list. This list is maintained in an `ignore.json` file in your project directory.
- `reset`: Reset the ignore list by clearing the `ignore.json` file.

### Examples

- **Dump all C language source files**:

  ```bash
  dump_source -lang c
  ```

- **Dump all JavaScript files and include `.html` and `.css` files**:

  ```bash
  dump_source -lang javascript -ext .html .css
  ```

- **Ignore specific files**:

  ```bash
  dump_source ignore secret.js config.js
  ```

- **Reset the ignore list**:

  ```bash
  dump_source reset
  ```

- **Display help message**:

  ```bash
  dump_source -h
  ```

### Output

After running the command, a markdown file named `dump-YYYY-MM-DDTHH-MM-SS.sssZ.md` will be created in the current directory. The filename includes a timestamp to ensure uniqueness.

## Configuration

The `dump_source` tool relies on a `config.json` file to map programming languages to their associated file extensions and abbreviations. This file should be located in the same directory as the script (usually where `dump_source` is installed).

Example `config.json`:

```json
{
  "c": {
    "file_extensions": [".c", ".h"],
    "abbreviations": ["c", "c99", "c11"]
  },
  "javascript": {
    "file_extensions": [".js", ".jsx"],
    "abbreviations": ["js", "javascript", "node"]
  },
  "python": {
    "file_extensions": [".py"],
    "abbreviations": ["py", "python"]
  }
}
```

You can customize this file to include additional languages or modify existing ones to suit your needs.

## Ignore List

The tool maintains an ignore list in an `ignore.json` file located in your project directory. This allows you to exclude specific files or directories from being included in the dump.

- **Add to Ignore List**:

  Use the `ignore` command followed by filenames or directory names.

  ```bash
  dump_source ignore secrets.py config/
  ```

- **Reset Ignore List**:

  Use the `reset` command to clear the ignore list.

  ```bash
  dump_source reset
  ```

- **Automatic Ignore**:

  - Files and directories specified in your `.gitignore` file are automatically ignored.
  - Certain files and directories are always excluded:
    - `.env`
    - `constant`
    - `constants`
    - Hidden directories like `.git`, `.svn`, `.hg`
    - System files like `.DS_Store`
    - Compiled directories like `__pycache__`
    - Node modules directory `node_modules`

## Notes

- **File Inclusion Logic**:

  - A file is included if:
    - Its extension matches one of the allowed extensions.
    - Its basename matches one of the allowed extensions (useful for files without extensions).
  - A file is excluded if:
    - It is specified in the ignore list.
    - It matches a pattern in `.gitignore`.
    - It is one of the always-excluded files (e.g., `.env`).

- **Supported Languages**:

  The languages supported are defined in the `config.json` file. Ensure that the language you specify with `-lang` exists in this configuration.

- **Abbreviations**:

  You can use abbreviations for languages when specifying the `-lang` option, as defined in the `config.json`.

- **Error Handling**:

  The tool will output error messages if:

  - An unknown argument is provided.
  - No language or extension is specified.
  - The specified language is not found in `config.json`.

## License

This project is licensed under the [MIT License](LICENSE).

---

**Disclaimer**: This tool is designed to help you create a snapshot of your source code. Please ensure that you do not include sensitive information or violate any licenses when sharing the generated markdown files. This is precisely why we implemented the `ignore` feature.