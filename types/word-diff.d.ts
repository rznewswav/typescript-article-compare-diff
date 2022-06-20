declare module 'word-diff' {
    export namespace WordDiff {
        export type DiffType = {
            remove?: string
            add?: string
        }

        export type ConstantType = {
            text?: string
        }
    }
    export function diffString(str1: string, str2: string): (WordDiff.DiffType | WordDiff.ConstantType)[]
}