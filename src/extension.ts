// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NotebookSerializer } from './notebook/serializer';
import { NotebookController } from './notebook/controller';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.workspace.registerNotebookSerializer("test-notebook", new NotebookSerializer(), {
		transientOutputs: false,
		transientCellMetadata: {
			breakpointMargin: true,
			custom: false,
			attachments: false
		},
		cellContentMetadata: {
			attachments: true
		}
	} as vscode.NotebookDocumentContentOptions));
	context.subscriptions.push(new NotebookController());

	context.subscriptions.push(vscode.commands.registerCommand("vscode-notebook-test.newNotebook", async () =>{
		await vscode.window.showNotebookDocument(
			await vscode.workspace.openNotebookDocument(
				"test-notebook", 
				new vscode.NotebookData([
					new vscode.NotebookCellData(vscode.NotebookCellKind.Code, "print(\"cell 1\")", "python"),
					new vscode.NotebookCellData(vscode.NotebookCellKind.Code, "print(\"cell 2\")", "python"),
					new vscode.NotebookCellData(vscode.NotebookCellKind.Code, "print(\"cell 3\")", "python")
				]))
			);
		}));
}

// This method is called when your extension is deactivated
export function deactivate() {}
