import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from "util";

interface ISavedNotebook {
    cells: ISavedNotebookCell[]
    metadata?: { [key: string]: any };
}

interface ISavedNotebookCell {
    kind: vscode.NotebookCellKind;
    value: string;
    language: string;   
    outputs?: ISavedNotebookCellOutput[];
    metadata?: { [key: string]: any };
    executionSummary?: ISavedNotebookCellExecutionSummary
}

interface ISavedNotebookCellExecutionSummary {
    executionOrder?: number
    success?: boolean
    timing?: {
        /**
         * Execution start time.
         */
        readonly startTime: number;
        /**
         * Execution end time.
         */
        readonly endTime: number;
    };
}

interface ISavedNotebookCellOutput {
    items: ISavedNotebookCellOutputItem[];
    metadata?: { [key: string]: any };
}

interface ISavedNotebookCellOutputItem {
    mime: string;
    data: string;
}

export class NotebookSerializer implements vscode.NotebookSerializer {
    async deserializeNotebook(
        content: Uint8Array,
        _token: vscode.CancellationToken
    ): Promise<vscode.NotebookData> {
        var contents = new TextDecoder().decode(content);

        let raw: ISavedNotebook;
        try {
            raw = (<ISavedNotebook>JSON.parse(contents));
        } catch {
            raw = {cells: [] };
        }

        return externalDataToVSCodeData(raw);
    }

    async serializeNotebook(
        data: vscode.NotebookData,
        _token: vscode.CancellationToken
    ): Promise<Uint8Array> {
        console.log('serializing notebook');
        console.log(data);
        const raw = vscodeDataToExternalData(data);
        return new TextEncoder().encode(JSON.stringify(raw));
    }
}

function externalDataToVSCodeData(source: ISavedNotebook) : vscode.NotebookData {
    const result = new vscode.NotebookData(source.cells.map(externalCellToVSCodeCell));
    result.metadata = source.metadata;
    return result;
}

function vscodeDataToExternalData(source: vscode.NotebookData) : ISavedNotebook {
    return { 
        cells: source.cells.map(vscodeCellToExternalCell),
        metadata: source.metadata
    };
}

function externalCellToVSCodeCell(source: ISavedNotebookCell) : vscode.NotebookCellData {
    const result = new vscode.NotebookCellData(
        source.kind,
        source.value,
        source.language
    );

    if (source.executionSummary) {
        result.executionSummary = { 
            executionOrder: source.executionSummary.executionOrder,
            timing: source.executionSummary.timing
        };
    }

    if (source.outputs) {
        result.outputs = source.outputs.map(externalOutputToVSCodeOutput);
    }

    return result;
}

function vscodeCellToExternalCell(source: vscode.NotebookCellData) : ISavedNotebookCell {
    return {
        kind: source.kind,
        language: source.languageId,
        value: source.value,
        executionSummary: source.executionSummary,
        metadata: source.metadata,
        outputs: source.outputs?.map(vscodeOutputToExternalOutput)
    };
}

function externalOutputToVSCodeOutput(source: ISavedNotebookCellOutput) : vscode.NotebookCellOutput {
    return {
        metadata: source.metadata,
        items: source.items.map(externalOutputItemToVSCodeOutputItem),
    };
}

function vscodeOutputToExternalOutput(source: vscode.NotebookCellOutput) : ISavedNotebookCellOutput {
    return {
        metadata: source.metadata,
        items: source.items?.map(vscodeOutputItemToExternalOutputItem)
    };
}

function externalOutputItemToVSCodeOutputItem(source: ISavedNotebookCellOutputItem) : vscode.NotebookCellOutputItem {
    return {
        mime: source.mime,
        data: Buffer.from(source.data, 'base64')
    };
}

function vscodeOutputItemToExternalOutputItem(source: vscode.NotebookCellOutputItem) : ISavedNotebookCellOutputItem {
    return {
        data: Buffer.from(source.data).toString('base64'),
        mime: source.mime
    };
}