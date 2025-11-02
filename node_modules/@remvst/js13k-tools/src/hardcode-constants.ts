export function hardcodeConstants(
    code: string,
    constants: {[key:string]: string | number | boolean},
) {
    for (const constant of Object.keys(constants)) {
        const value = constants[constant];
        const regex = new RegExp('\\b' + constant + '\\b', 'g');

        code = code.replace(regex, value.toString());
    }

    return code;
}
