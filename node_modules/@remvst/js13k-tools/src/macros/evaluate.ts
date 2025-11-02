import { Macro } from "../macro";

export const EVALUATE: Macro = {
    name: 'evaluate',
    apply: (s: string) => eval(s),
}
