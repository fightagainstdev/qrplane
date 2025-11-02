export interface Macro {
    name: string,
    apply: (input: string) => string;
    revert?: (input: string) => string;
}

export function macro(code: string, macro: Macro) {
    const undoName = 'revert' + macro.name.slice(0, 1).toUpperCase() + macro.name.slice(1);
    const undoCode = macro.revert
        ? macro.revert.toString().replace(/function/, 'function ' + undoName) + '\n\n'
        : '';

    code = undoCode + code;

    let characterDiff = undoCode.length;

    while (true) {
        const regex = new RegExp(macro.name + '\\(', 'g');
        const match = regex.exec(code);

        if (!match) break;

        const matchStart = match.index;

        let lvl = 1;
        let i = matchStart + (macro.name + '(').length + 1;
        while (lvl > 0 && i < code.length) {
            if (code.charAt(i) === '(') {
                lvl++;
            } else if (code.charAt(i) === ')') {
                lvl--;
            }

            i++;
        }

        const matchEnd = i;

        const contentStart = matchStart + (macro.name + '(').length;
        const contentEnd = matchEnd - 1;

        const content = code.substring(contentStart, contentEnd);

        const modifiedContent = macro.apply(content);

        characterDiff += modifiedContent.length - JSON.stringify(content).length;

        const sourceBefore = code.substring(0, matchStart);
        const sourceAfter = code.substring(matchEnd);

        if (undoCode) {
            code = sourceBefore + undoName + '(' + modifiedContent + ')' + sourceAfter;
        } else {
            code = sourceBefore + modifiedContent + sourceAfter;
        }
    }

    return code;
}
